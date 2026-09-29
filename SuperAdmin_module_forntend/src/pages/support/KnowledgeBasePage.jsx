import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/modals/Modal';
import FormInput from '../../components/common/FormInput';
import { BookOpen, Search, Plus, FileText, Edit, Trash2, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import knowledgeBaseService from '../../services/knowledgeBaseService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = { title: '', category: 'General', content: '' };

export const KnowledgeBasePage = () => {
  const { success, error: showError } = useNotification();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    setError(false);
    knowledgeBaseService.getArticles()
      .then((res) => setArticles(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load articles', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const categories = ['All', ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || art.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (article) => {
    setEditingId(article.id);
    setForm({ title: article.title, category: article.category, content: article.content });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await knowledgeBaseService.updateArticle(editingId, form);
        success('Article updated successfully!', 'Article Updated');
      } else {
        await knowledgeBaseService.createArticle(form);
        success('Article published successfully!', 'Article Published');
      }
      setModalOpen(false);
      fetchArticles();
    } catch (err) {
      showError(err.message || 'Failed to save article', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await knowledgeBaseService.deleteArticle(deleteTarget.id);
      success(`"${deleteTarget.title}" deleted.`, 'Article Deleted');
      setDeleteTarget(null);
      fetchArticles();
    } catch (err) {
      showError(err.message || 'Failed to delete article', 'Delete Failed');
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Article Title',
      key: 'title',
      render: (val) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span>
        </div>
      ),
    },
    { header: 'Category', key: 'category' },
    { header: 'Author', key: 'author', render: (val) => val || '—' },
    { header: 'Views', key: 'views', render: (val) => <span className="font-semibold">{val} views</span> },
    { header: 'Last Updated', key: 'updatedAt', render: (val) => <span className="font-mono text-xs">{new Date(val).toLocaleDateString()}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchArticles} />;
  }

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Knowledge Base & Documentation" subtitle="Manage help articles, tutorial docs and platform FAQs for onboarding tenants" />
        <button onClick={openAddModal} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" />
          <span>Add Help Article</span>
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
        <div className="flex gap-2 self-stretch sm:self-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Articles ({filteredArticles.length})</h3>
        </div>
        {filteredArticles.length === 0 ? (
          <EmptyState title="No Articles Yet" description="Publish a help article for onboarding tenants and support agents to reference." actionLabel="Add Help Article" onAction={openAddModal} />
        ) : (
          <DataTable columns={columns} data={filteredArticles} />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Article' : 'Add Help Article'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Title" required value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="e.g. How to Onboard a New School" />
          <FormInput label="Category" required value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} placeholder="e.g. Onboarding, Billing, Troubleshooting" />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Content</label>
            <textarea
              rows={8}
              required
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Write the article content..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50">
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Article">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeBasePage;
