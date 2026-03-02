/**
 * DrawingOverlay - A canvas-based drawing overlay for map applications
 * Supports freehand drawing, export to GeoJSON/PNG/SVG, and coordinate conversion
 */
export class DrawingOverlay {
  /**
   * @param {HTMLElement} container - Any block-level element (positioned or not).
   * @param {Object} options
   * @param {boolean} [options.toolbar=true] - Show built-in toolbar UI
  * @param {number}  [options.strokeWidth=2]
   * @param {string}  [options.strokeStyle='#1a73e8']
   * @param {number}  [options.simplifyTolerance=0] // Douglas-Peucker tolerance (px)
   * @param {(pt:{x:number,y:number})=>{lng:number,lat:number}} [options.toLngLat] - Optional: convert screen px -> lng/lat
   * @param {(ll:{lng:number,lat:number})=>{x:number,y:number}} [options.fromLngLat] - Optional: convert lng/lat -> screen px
   * @param {(payload:{geojson:Object, svg:string, pngBlob?:Blob})=>void} [options.onSave]
    * @param {(enabled:boolean)=>void} [options.onToggleEnabled] - Optional: notify when edit mode is toggled
   */
  constructor(container, options = {}) {
    if (!container) throw new Error('DrawingOverlay: container required');
    this.container = container;
    this.opts = {
      toolbar: options.toolbar !== false,
      strokeWidth: options.strokeWidth ?? 2,
      strokeStyle: options.strokeStyle ?? '#1a73e8',
      simplifyTolerance: options.simplifyTolerance ?? 0,
      toLngLat: options.toLngLat || null,
      fromLngLat: options.fromLngLat || null,
      onSave: options.onSave || null,
    };

    // Optional callback for external components to react to edit mode changes
    this.onToggleEnabled = options.onToggleEnabled || null;

    // State (start in edit mode OFF by default)
    this.enabled = false;
    this.currentPath = null;  // [{x,y}]
    this.paths = [];          // Array of paths
    this.undoStack = [];

    // DOM
    this.wrap = document.createElement('div');
    this.wrap.className = 'drw-overlay-wrap';
    // Ensure container is positioned for absolute canvas; if static, make relative:
    const cs = getComputedStyle(container);
    if (cs.position === 'static') container.style.position = 'relative';
    container.appendChild(this.wrap);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'drw-canvas';
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.wrap.appendChild(this.canvas);

    if (this.opts.toolbar) this._buildToolbar();
    this.badge = document.createElement('div');
    this.badge.className = 'drw-badge drw-hidden';
    this.badge.textContent = 'Edit mode: OFF';
    this.wrap.appendChild(this.badge);

    // Start with edit mode disabled on initial load
    this.disable();

    // Resize handling
    const ro = new ResizeObserver(() => this._resizeCanvas());
    ro.observe(this.wrap);
    this._resizeCanvas();

    // Pointer events
    this._bindEvents();
    this._draw(); // initial clear
  }

  enable() {
    this.enabled = true;
    // Allow overlay to receive pointer events and show crosshair cursor
    if (this.wrap) {
      this.wrap.style.pointerEvents = 'auto';
    }
    this.canvas.style.pointerEvents = 'auto';
    this.canvas.style.cursor = 'crosshair';
    // Also set cursor on container/body so user clearly sees edit mode
    if (this.container) {
      this.container.style.cursor = 'crosshair';
    }
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.cursor = 'crosshair';
    }
    this.badge?.classList.remove('drw-hidden');
    this._setBtnStates();
    if (this.onToggleEnabled) {
      this.onToggleEnabled(true);
    }
  }

  disable() {
    this.enabled = false;
    // Let pointer events pass through to the underlying map
    if (this.wrap) {
      this.wrap.style.pointerEvents = 'none';
    }
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.cursor = '';
    if (this.container) {
      this.container.style.cursor = '';
    }
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.cursor = '';
    }
    this.badge?.classList.add('drw-hidden');
    this._setBtnStates();
    if (this.onToggleEnabled) {
      this.onToggleEnabled(false);
    }
  }

  clear() {
    if (!this.paths.length) return;
    this.undoStack.push({ type: 'clear', paths: this.paths.slice() });
    this.paths = [];
    this.currentPath = null;
    this._draw();
    this._setBtnStates();
  }

  undo() {
    if (this.currentPath && this.currentPath.length > 1) {
      // undo current path entirely
      this.currentPath = null;
      this._draw();
      return;
    }
    if (!this.paths.length) return;
    const last = this.paths.pop();
    this.undoStack.push({ type: 'path', path: last });
    this._draw();
    this._setBtnStates();
  }

  redo() {
    // Simple redo skipped for brevity; could be added if needed
  }

  /** Returns a GeoJSON FeatureCollection of LineStrings (lng/lat if converters provided; else pixel coords). */
  getGeoJSON() {
    const coords = (pt) =>
      this.opts.toLngLat ? this.opts.toLngLat(pt) : { lng: pt.x, lat: pt.y };

    const features = this.paths
      .filter(p => p.length > 1)
      .map(p => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: p.map(pt => {
            const ll = coords(pt);
            return [ll.lng, ll.lat];
          })
        }
      }));

    return { type: 'FeatureCollection', features };
  }

  /** Triggers a file download with GeoJSON */
  exportGeoJSON(filename = 'drawing.geojson') {
    const data = JSON.stringify(this.getGeoJSON());
    const blob = new Blob([data], { type: 'application/geo+json' });
    this._downloadBlob(blob, filename);
    return blob;
  }

  /** Exports a PNG of the overlay */
  exportPNG(filename = 'drawing.png') {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          this._downloadBlob(blob, filename);
          resolve(blob);
        } else {
          resolve(null);
        }
      }, 'image/png');
    });
  }

  /** Emits SVG path overlay (useful if you want vector output). */
  exportSVG() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pathData = this.paths.map(path => {
      if (!path.length) return '';
      return 'M ' + path.map(p => `${p.x} ${p.y}`).join(' L ');
    }).join(' ');
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <path d="${pathData}" fill="none" stroke="${this.opts.strokeStyle}" stroke-width="${this.opts.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`.trim();
    return svg;
  }

  /** Programmatic save: calls onSave (if provided) with { geojson, svg, pngBlob? } */
  async save() {
    const payload = {
      geojson: this.getGeoJSON(),
      svg: this.exportSVG()
    };
    if (this.opts.onSave) {
      // PNG is optional; only generate if dev wants it
      payload.pngBlob = await this.exportPNG('drawing.png');
      this.opts.onSave(payload);
    }
    return payload;
  }

  // ============= internals =============
  _bindEvents() {
    const toLocal = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    let drawing = false;

    const onDown = (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      drawing = true;
      this.currentPath = [toLocal(e)];
    };

    const onMove = (e) => {
      if (!this.enabled || !drawing) return;
      e.preventDefault();
      const pt = toLocal(e);
      // throttle by distance to keep lines smooth
      const last = this.currentPath[this.currentPath.length - 1];
      const dx = pt.x - last.x, dy = pt.y - last.y;
      if (dx*dx + dy*dy > 2) this.currentPath.push(pt);
      this._draw();
    };

    const onUp = (e) => {
      if (!this.enabled || !drawing) return;
      e.preventDefault();
      drawing = false;
      if (this.currentPath && this.currentPath.length > 1) {
        let finalized = this.currentPath;
        if (this.opts.simplifyTolerance > 0) {
          finalized = this._simplifyPath(finalized, this.opts.simplifyTolerance);
        }
        this.paths.push(finalized);
      }
      this.currentPath = null;
      this._draw();
      this._setBtnStates();
    };

    // Pointer events
    this.canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    // Prevent gestures causing scroll/zoom while drawing
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  _resizeCanvas() {
    const { width, height } = this.wrap.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    // reset transform (already set to DPR in _resizeCanvas)
    ctx.clearRect(0, 0, width, height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.opts.strokeStyle;
    ctx.lineWidth = this.opts.strokeWidth;

    const render = (path) => {
      if (!path || path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    };

    this.paths.forEach(render);
    if (this.currentPath) render(this.currentPath);
  }

  _downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  _setBtnStates() {
    if (!this.toolbar) return;
    const hasPaths = this.paths.length > 0 || (this.currentPath && this.currentPath.length > 1);
    this.btnUndo.disabled = !hasPaths;
    this.btnClear.disabled = !this.paths.length;
  }

  _buildToolbar() {
    const tb = document.createElement('div');
    tb.className = 'drw-toolbar';

    const mkBtn = (label, cls = '') => {
      const b = document.createElement('button');
      b.className = `drw-btn ${cls}`.trim();
      b.type = 'button';
      b.textContent = label;
      tb.appendChild(b);
      return b;
    };

    const btnToggle = mkBtn('EDIT MODE OFF', 'primary');
    const sep = document.createElement('div'); sep.className = 'drw-sep'; tb.appendChild(sep);
    const btnSave = mkBtn('Save');
    const btnExport = mkBtn('Export .geojson');
    const btnPng = mkBtn('Export .png');
    const btnSvg = mkBtn('Export .svg');
    const sep2 = document.createElement('div'); sep2.className = 'drw-sep'; tb.appendChild(sep2);

    // Stroke width adjustment toggle (cycles through preset widths)
    const strokeLevels = [1, 2, 3, 4];
    let strokeIndex = strokeLevels.indexOf(this.opts.strokeWidth);
    if (strokeIndex === -1) strokeIndex = 1; // default to 2px if current not in presets
    const btnStroke = mkBtn(`Stroke ${strokeLevels[strokeIndex]}px`);

    const updateStrokeFromToggle = () => {
      this.opts.strokeWidth = strokeLevels[strokeIndex];
      btnStroke.textContent = `Stroke ${this.opts.strokeWidth}px`;
      this._draw();
    };

    btnStroke.addEventListener('click', () => {
      strokeIndex = (strokeIndex + 1) % strokeLevels.length;
      updateStrokeFromToggle();
    });

    const sep3 = document.createElement('div'); sep3.className = 'drw-sep'; tb.appendChild(sep3);
    const btnUndo = mkBtn('Undo');
    const btnClear = mkBtn('Clear');

    this.wrap.appendChild(tb);
    this.toolbar = tb;
    this.btnUndo = btnUndo;
    this.btnClear = btnClear;

    const setToggleUI = () => {
      if (this.enabled) {
        btnToggle.textContent = 'EDIT MODE ON';
        btnToggle.classList.add('primary');
      } else {
        btnToggle.textContent = 'EDIT MODE OFF';
        btnToggle.classList.add('primary'); // keep visual anchor
      }
    };
    setToggleUI();

    btnToggle.addEventListener('click', () => {
      this.enabled ? this.disable() : this.enable();
      setToggleUI();
    });
    btnSave.addEventListener('click', async () => { await this.save(); });
    btnExport.addEventListener('click', () => this.exportGeoJSON());
    btnPng.addEventListener('click', () => this.exportPNG());
    btnSvg.addEventListener('click', () => {
      const svg = this.exportSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      this._downloadBlob(blob, 'drawing.svg');
    });
    btnUndo.addEventListener('click', () => this.undo());
    btnClear.addEventListener('click', () => this.clear());

    this._setBtnStates();
  }

  // Douglas–Peucker simplification for nicer lines (optional)
  _simplifyPath(points, tolerance) {
    if (points.length <= 2) return points;
    const sqTol = tolerance * tolerance;

    const getSqDist = (p1, p2) => {
      const dx = p1.x - p2.x, dy = p1.y - p2.y;
      return dx * dx + dy * dy;
    };
    const getSqSegDist = (p, p1, p2) => {
      let x = p1.x, y = p1.y;
      let dx = p2.x - x, dy = p2.y - y;

      if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) { x = p2.x; y = p2.y; }
        else if (t > 0) { x += dx * t; y += dy * t; }
      }
      dx = p.x - x; dy = p.y - y;
      return dx * dx + dy * dy;
    };

    const simplifyRadialDist = (pts, sqTol) => {
      const res = [pts[0]];
      let prev = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (getSqDist(p, prev) > sqTol) {
          res.push(p);
          prev = p;
        }
      }
      if (prev !== pts[pts.length - 1]) res.push(pts[pts.length - 1]);
      return res;
    };

    const simplifyDpStep = (pts, first, last, sqTol, simplified) => {
      let maxSqDist = sqTol;
      let index = -1;
      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
        if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
      }
      if (maxSqDist > sqTol) {
        if (index - first > 1) simplifyDpStep(pts, first, index, sqTol, simplified);
        simplified.push(pts[index]);
        if (last - index > 1) simplifyDpStep(pts, index, last, sqTol, simplified);
      }
    };

    points = simplifyRadialDist(points, sqTol);
    const last = points.length - 1;
    const simplified = [points[0]];
    simplifyDpStep(points, 0, last, sqTol, simplified);
    simplified.push(points[last]);
    return simplified;
  }

  destroy() {
    // Cleanup method
    if (this.wrap && this.wrap.parentNode) {
      this.wrap.parentNode.removeChild(this.wrap);
    }
  }
}

// Make available globally if included via <script> without bundler
if (typeof window !== 'undefined') {
  window.DrawingOverlay = DrawingOverlay;
}
