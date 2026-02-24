import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useHydrationStore } from '../lib/hydration-store';
import { Users, Plus, UserPlus, Hash, ArrowRight } from 'lucide-react';

export default function Groups() {
  const { user } = useHydrationStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('groups')
      .select('*, group_members!inner(user_id)')
      .eq('group_members.user_id', user?.id);
    setGroups(data || []);
  };

  useEffect(() => { if (user) fetchGroups(); }, [user]);

  const createGroup = async () => {
    if (!newGroupName || !user) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: group, error: gError } = await supabase
      .from('groups')
      .insert([{ name: newGroupName, code, created_by: user.id }])
      .select().single();

    if (!gError && group) {
      await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      setNewGroupName('');
      fetchGroups();
    } else {
      alert("Error creating group. Check SQL policies.");
    }
    setLoading(false);
  };

  const joinGroup = async () => {
    if (!joinCode || !user) return;
    setLoading(true);
    const { data: group } = await supabase.from('groups').select('id').eq('code', joinCode.toUpperCase()).single();
    
    if (group) {
      const { error } = await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      if (!error) {
        setJoinCode('');
        fetchGroups();
      } else {
        alert("Already a member or error joining.");
      }
    } else {
      alert("Invalid Group Code");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      <header className="flex items-center gap-2 pt-2">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Users className="text-white w-6 h-6" />
        </div>
        <h1 className="font-black text-xl">Hydration Groups</h1>
      </header>

      {/* Join Group */}
      <div className="bg-[#161F32] p-6 rounded-[24px] border border-slate-800 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400"/> Join a Family</h2>
        <div className="flex gap-2">
          <input 
            value={joinCode} 
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500"
          />
          <button onClick={joinGroup} className="bg-indigo-500 px-4 rounded-xl font-bold"><ArrowRight/></button>
        </div>
      </div>

      {/* Create Group */}
      <div className="bg-[#161F32] p-6 rounded-[24px] border border-slate-800 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-400"/> Create New Group</h2>
        <input 
          value={newGroupName} 
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Group Name (e.g. Family)"
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500"
        />
        <button 
          onClick={createGroup} 
          disabled={loading}
          className="w-full bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>

      {/* Your Groups */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Groups</h3>
        {groups.map(g => (
          <div key={g.id} className="bg-[#161F32] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <span className="font-bold">{g.name}</span>
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <Hash className="w-3 h-3 text-slate-500"/>
              <span className="text-xs font-mono font-bold text-indigo-400">{g.code}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}