import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { BookOpen, Search, Plus, FileText, Edit, Trash2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const KnowledgeBasePage = () => {
  const { success } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    { id: 1, title: 'How to Onboard a New School / Institute', category: 'Onboarding', author: 'Platform Team', views: 824, date: '2026-08-20' },
    { id: 2, title: 'Understanding Subscription Invoicing & Tax Billing', category: 'Billing', author: 'Finance Admin', views: 512, date: '2026-08-18' },
    { id: 3, title: 'Setting Up Custom Domains for Institution Portals', category: 'Configuration', author: 'DevOps Lead', views: 1205, date: '2026-08-15' },
    { id: 4, title: 'Resolving SMTP Mail Server TLS Block Errors', category: 'Troubleshooting', author: 'Sysops Support', views: 342, date: '2026-08-10' },
    { id: 5, title: 'Customizing Student Grade Card Excel Templates', category: 'Feature Guide', author: 'Product Specialist', views: 490, date: '2026-08-05' },
  ];

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { 
      header: 'Article Title', 
      key: 'title', 
      render: (val) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span>
        </div>
      )
    },
    { header: 'Category', key: 'category' },
    { header: 'Author', key: 'author' },
    { header: 'Views Count', key: 'views', render: (val) => <span className="font-semibold">{val} views</span> },
    { header: 'Last Updated', key: 'date', render: (val) => <span className="font-mono text-xs">{val}</span> },
    {
      header: 'Actions',
      key: 'id',
      render: (id) => (
        <div className="flex gap-2">
          <button onClick={() => success('Editing article content')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => success('Article removed successfully')} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Knowledge Base & Documentation" subtitle="Manage help articles, tutorial docs and platform FAQs for onboarding tenants" />
        <button onClick={() => success('Opening Add Article editor...')} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" />
          <span>Add Help Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search articles or categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-705 rounded-xl text-xs"
          />
        </div>
        <div className="flex gap-2 self-stretch sm:self-auto overflow-x-auto">
          <button className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold rounded-lg">All Articles</button>
          <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Onboarding</button>
          <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Billing</button>
          <button className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Troubleshooting</button>
        </div>
      </div>

      {/* Articles list */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Articles Audit Logs</h3>
        </div>
        <DataTable columns={columns} data={filteredArticles} />
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
