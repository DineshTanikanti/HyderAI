import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useHydrationStore } from '../lib/hydration-store';

export default function Groups() {
  const { user } = useHydrationStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [name, setName] = useState('');

  const load = async () => {
    const { data } = await supabase.from('groups').select('*, group_members!inner(*)').eq('group_members.user_id', user?.id);
    setGroups(data || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleCreate = async () => {
    if (!name || !user) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 1. Create the group
    const { data: group, error } = await supabase.from('groups')
      .insert([{ name, code, created_by: user.id }]).select().single();

    if (error) return alert("Error: " + error.message);

    // 2. Add yourself as the first member
    await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
    
    setName('');
    load();
  };

  return (
    <div className="p-6 bg-[#0B1120] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Groups</h1>
      <div className="bg-[#161F32] p-6 rounded-3xl border border-slate-800 space-y-4">
        <input 
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Group Name (e.g. Family)"
          className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl outline-none"
        />
        <button onClick={handleCreate} className="w-full bg-cyan-500 py-4 rounded-xl font-bold">Create Group</button>
      </div>
      
      <div className="mt-8 space-y-4">
        {groups.map(g => (
          <div key={g.id} className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center">
            <span className="font-bold">{g.name}</span>
            <span className="text-cyan-400 font-mono font-bold">{g.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}