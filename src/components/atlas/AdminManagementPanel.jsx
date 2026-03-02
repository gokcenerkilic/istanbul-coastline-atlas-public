import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Check, X, RefreshCw } from 'lucide-react';
import { Contribution, Drawing, TextBox, generateSequentialId } from '@/api/entities';

export default function AdminManagementPanel({ language, onClose }) {
  const [activeTab, setActiveTab] = useState('contributions');
  const [contributions, setContributions] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const translations = {
    tr: {
      title: 'Yönetim Paneli',
      contributions: 'Katkılar',
      drawings: 'Çizimler',
      textBoxes: 'Metin Kutuları',
      id: 'ID',
      title_field: 'Başlık',
      contributor: 'Katkıda Bulunan',
      status: 'Durum',
      date: 'Tarih',
      actions: 'İşlemler',
      delete: 'Sil',
      approve: 'Onayla',
      reject: 'Reddet',
      view: 'Görüntüle',
      confirmDelete: 'Bu öğeyi silmek istediğinizden emin misiniz?',
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      refresh: 'Yenile',
      noItems: 'Öğe bulunamadı',
      loading: 'Yükleniyor...'
    },
    en: {
      title: 'Admin Management Panel',
      contributions: 'Contributions',
      drawings: 'Drawings',
      textBoxes: 'Text Boxes',
      id: 'ID',
      title_field: 'Title',
      contributor: 'Contributor',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      delete: 'Delete',
      approve: 'Approve',
      reject: 'Reject',
      view: 'View',
      confirmDelete: 'Are you sure you want to delete this item?',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      refresh: 'Refresh',
      noItems: 'No items found',
      loading: 'Loading...'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'contributions') {
        const data = await Contribution.filter({}, { sort: { created_date: -1 } });
        setContributions(data);
      } else if (activeTab === 'drawings') {
        const data = await Drawing.filter({}, { sort: { created_date: -1 } });
        setDrawings(data);
      } else if (activeTab === 'textBoxes') {
        const data = await TextBox.filter({}, { sort: { created_date: -1 } });
        setTextBoxes(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item, entity) => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      await entity.delete(item._id);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleStatusChange = async (item, entity, newStatus) => {
    try {
      await entity.update(item._id, { 
        status: newStatus,
        approved_date: newStatus === 'approved' ? new Date() : null
      });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {t[status] || status}
      </span>
    );
  };

  const renderTable = (items, entity, idField) => {
    if (loading) {
      return <div className="text-center py-8 text-gray-500">{t.loading}</div>;
    }

    if (items.length === 0) {
      return <div className="text-center py-8 text-gray-500">{t.noItems}</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.id}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.title_field}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.contributor}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.status}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.date}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono">{item[idField]}</td>
                <td className="px-4 py-3 text-sm">{item.title || item.content?.substring(0, 50) || '-'}</td>
                <td className="px-4 py-3 text-sm">{item.contributor_name || '-'}</td>
                <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                <td className="px-4 py-3 text-sm">{new Date(item.created_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(item, entity, 'approved')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title={t.approve}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(item, entity, 'rejected')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title={t.reject}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title={t.view}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item, entity)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold">{t.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded"
              title={t.refresh}
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'contributions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.contributions}
          </button>
          <button
            onClick={() => setActiveTab('drawings')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'drawings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.drawings}
          </button>
          <button
            onClick={() => setActiveTab('textBoxes')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'textBoxes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.textBoxes}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'contributions' && renderTable(contributions, Contribution, 'contributionId')}
          {activeTab === 'drawings' && renderTable(drawings, Drawing, 'drawingId')}
          {activeTab === 'textBoxes' && renderTable(textBoxes, TextBox, 'textBoxId')}
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">{selectedItem.title || 'Details'}</h3>
                <button onClick={() => setSelectedItem(null)}>
                  <X size={20} />
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
