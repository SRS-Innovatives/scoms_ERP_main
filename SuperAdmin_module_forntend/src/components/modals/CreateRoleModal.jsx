import React, { useState } from 'react';
import Modal from './Modal';
import FormInput from '../common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck } from 'lucide-react';

export const CreateRoleModal = ({ isOpen, onClose }) => {
  const { success } = useNotification();
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Role "${roleName}" created with RBAC permission set!`, 'Role Created');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Custom Platform Role">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <FormInput
          label="Role Title"
          required
          value={roleName}
          onChange={setRoleName}
          placeholder="e.g. Regional Support Manager"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Define role scope..."
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" /> Save Role
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoleModal;
