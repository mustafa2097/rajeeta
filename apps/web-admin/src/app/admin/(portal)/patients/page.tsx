'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PatientProfileCard } from '@/components/PersonProfileCard';
import type { User } from '@/lib/types';
import a from '@/styles/admin.module.css';

export default function AdminPatientsPage() {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ role: 'PATIENT' });
      if (query) params.set('search', query);
      const data = await api<User[]>(`/admin/accounts?${params}`);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل المرضى');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <header className={`${a.pageHead} ${a.fadeUp}`}>
        <h1 className={a.pageTitle}>المرضى</h1>
        <p className={a.pageLead}>إدارة حسابات المرضى وعرض بروفايل كل مريض</p>
      </header>

      <div className={a.searchBar}>
        <svg
          className={a.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" strokeLinecap="round" />
        </svg>
        <input
          className={a.searchInput}
          type="search"
          placeholder="ابحث بالاسم أو البريد أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="بحث عن مريض"
        />
        <span className={a.searchCount}>{accounts.length} مريض</span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <div className="loading-screen">
          <div>
            <div className="spinner" style={{ marginInline: 'auto' }} />
            جاري تحميل المرضى...
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className={a.empty}>
          {query ? 'لا يوجد مرضى بهذا الاسم' : 'لا يوجد مرضى مسجلون'}
        </div>
      ) : (
        <div className={a.profileGrid}>
          {accounts.map((account, index) => (
            <PatientProfileCard
              key={account.id}
              user={account}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
