import { base44 } from './base44Client';

// ============================================================================
// BASE44 ENTITY SCHEMAS
// ============================================================================
// These schemas define the structure of data stored in Base44.
// When you upload this project to Base44, these entities will be created automatically.

/**
 * CONTRIBUTIONS ENTITY
 * User-submitted observations about the coastline
 */
export const CONTRIBUTION_SCHEMA = {
  contributionId: 'string',      // Sequential ID (CONT-001)
  type: 'string',                // Type of submission
  category: 'string',            // observation, historical, environmental, cultural, other
  title: 'string',               // Title (max 200 chars)
  description: 'string',         // Description (max 2000 chars)
  contributor_name: 'string',    // Contributor name
  contributor_email: 'string',   // Contributor email
  location: {                    // Geographic coordinates
    lat: 'number',
    lng: 'number'
  },
  media_url: 'string',           // URL to uploaded media
  thumbnail_url: 'string',       // URL to thumbnail
  media_type: 'string',          // MIME type (image/jpeg, etc.)
  media_size: 'number',          // File size in bytes
  status: 'string',              // pending, approved, rejected
  rejection_reason: 'string',    // Admin feedback if rejected
  created_date: 'date',          // Submission date
  approved_date: 'date',         // Approval date
  approved_by: 'string',         // Admin user ID
  view_count: 'number',          // View tracking
  language: 'string'             // tr or en
};

/**
 * DRAWINGS ENTITY
 * User-drawn lines and paths on the map
 */
export const DRAWING_SCHEMA = {
  drawingId: 'string',           // Sequential ID (DRW-001)
  title: 'string',               // Title
  description: 'string',         // Description
  contributor_name: 'string',    // Contributor name
  category: 'string',            // coastline, infrastructure, erosion, development, other
  coordinates: 'array',          // Array of {lat, lng} points
  style: {                       // Visual style
    color: 'string',             // Hex color
    weight: 'number',            // Line width
    opacity: 'number'            // Transparency
  },
  bounds: {                      // Bounding box for spatial queries
    north: 'number',
    south: 'number',
    east: 'number',
    west: 'number'
  },
  length_meters: 'number',       // Calculated length
  status: 'string',              // pending, approved, rejected
  rejection_reason: 'string',    // Admin feedback if rejected
  created_date: 'date',          // Creation date
  approved_date: 'date',         // Approval date
  approved_by: 'string',         // Admin user ID
  language: 'string'             // tr or en
};

/**
 * TEXTBOXES ENTITY
 * Text annotations placed on the map
 */
export const TEXTBOX_SCHEMA = {
  textBoxId: 'string',           // Sequential ID (TXT-001)
  title: 'string',               // Title (optional)
  content: 'string',             // Text content (max 1000 chars)
  contributor_name: 'string',    // Contributor name
  coords: {                      // Geographic coordinates
    lat: 'number',
    lng: 'number'
  },
  style: {                       // Visual style
    fontSize: 'string',          // e.g., '14px'
    color: 'string',             // Text color
    backgroundColor: 'string',   // Background color
    fontWeight: 'string',        // normal, bold
    fontFamily: 'string'         // Font family
  },
  status: 'string',              // pending, approved, rejected
  rejection_reason: 'string',    // Admin feedback if rejected
  created_date: 'date',          // Creation date
  approved_date: 'date',         // Approval date
  approved_by: 'string',         // Admin user ID
  view_count: 'number',          // View tracking
  language: 'string'             // tr or en
};

/**
 * WORKSHOP_MEDIA ENTITY (Future)
 * Media files from workshops and events
 */
export const WORKSHOP_MEDIA_SCHEMA = {
  mediaId: 'string',             // Sequential ID (MED-001)
  title: 'string',               // Title
  description: 'string',         // Description
  media_url: 'string',           // URL to media file
  thumbnail_url: 'string',       // URL to thumbnail
  media_type: 'string',          // image, video, audio, document
  workshop_date: 'date',         // Workshop date
  location: {                    // Geographic coordinates (optional)
    lat: 'number',
    lng: 'number'
  },
  tags: 'array',                 // Tags for categorization
  created_date: 'date'           // Upload date
};

// Base44 entities are accessed through the client
// The client provides: base44.entities.EntityName.method()

// Helper to get entity with fallback
const getEntity = (entityName) => {
  if (base44.entities && base44.entities[entityName]) {
    return base44.entities[entityName];
  }
  // Return mock entity if not available
  return {
    list: () => Promise.resolve([]),
    filter: () => Promise.resolve([]),
    get: () => Promise.resolve(null),
    create: (data) => Promise.resolve({ _id: Date.now().toString(), ...data }),
    update: (id, data) => Promise.resolve({ _id: id, ...data }),
    delete: () => Promise.resolve({ success: true })
  };
};

// Export entity accessors
// Note: Entity schemas should be defined in Base44 dashboard
// Entity names must match exactly what's in Base44 dashboard
export const Contribution = getEntity('Contributions');
export const Drawing = getEntity('Drawing');
export const TextBox = getEntity('textboxes'); // Keep as 'textboxes' - already working
export const WorkshopMedia = getEntity('WorkshopMedia');

// Auth functions using Base44 client
export const User = {
  currentUser: () => base44.auth.me(),
  signIn: (returnPath) => base44.auth.login(returnPath),
  signOut: () => base44.auth.logout(),
  isAuthenticated: () => base44.auth.isAuthenticated(),
  isAdmin: async () => {
    try {
      const user = await base44.auth.me();
      return user?.role === 'admin' || user?.email?.includes('admin');
    } catch {
      return false;
    }
  }
};

// Helper function to generate sequential IDs
export const generateSequentialId = async (entity, prefix) => {
  try {
    // Get all items sorted by ID descending
    const items = await entity.filter({}, { sort: { [`${prefix.toLowerCase()}Id`]: -1 }, limit: 1 });
    
    if (items.length === 0) {
      return `${prefix}-001`;
    }
    
    // Extract number from last ID (e.g., "CONT-005" -> 5)
    const lastId = items[0][`${prefix.toLowerCase()}Id`];
    const lastNumber = parseInt(lastId.split('-')[1]) || 0;
    const nextNumber = lastNumber + 1;
    
    // Format with leading zeros (e.g., 6 -> "006")
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating sequential ID:', error);
    // Fallback to timestamp-based ID
    return `${prefix}-${Date.now()}`;
  }
};