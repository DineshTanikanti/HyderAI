import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useHydrationStore } from '../lib/hydration-store';
import { Users, Plus, UserPlus, ArrowRight } from 'lucide-react';

export default function Groups() {
  const { user } = useHydrationStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('groups')
      .select('*, group_members!inner(user_id)')
      .eq('group_members.user_id', user.id);
    setGroups(data || []);
  };

  useEffect(() => { 
    fetchGroups(); 
  }, [user]);

  const createGroup = async () => {
    if (!newGroupName || !user) {
      alert("Missing group name or you are not logged in.");
      return;
    }
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Try to create the group
    const { data: group, error: gError } = await supabase
      .from('groups')
      .insert([{ name: newGroupName, code, created_by: user.id }])
      .select()
      .single();

    // IF THERE IS AN ERROR, SHOW EXACT MESSAGE
    if (gError) {
      alert(`Database Error: ${gError.message}`);
      console.error("Supabase Error Details:", gError);
      setLoading(false);
      return;
    }

    // If group creation succeeds, add user as a member
    if (group) {
      const { error: mError } = await supabase
        .from('group_members')
        .insert([{ group_id: group.id, user_id: user.id }]);
      
      if (mError) {
        alert(`Member Join Error: ${mError.message}`);
      } else {
        setNewGroupName('');
        await fetchGroups();
      }
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
        await fetchGroups();
      } else {
        alert("Already a member or joining error.");
      }
    } else {
      alert("Invalid Code");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      <header className="flex items-center gap-2 pt-2">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Users className="text-white w-6 h-6" />
        </div>
        <h1 className="font-black text-xl">Groups</h1>
      </header>

      <div className="bg-[#161F32] p-6 rounded-[24px] border border-slate-800 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400"/> Join Group</h2>
        <div className="flex gap-2">
          <input 
            value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
            placeholder="6-digit code"
            className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none"
          />
          <button onClick={joinGroup} className="bg-indigo-500 px-4 rounded-xl"><ArrowRight/></button>
        </div>
      </div>

      <div className="bg-[#161F32] p-6 rounded-[24px] border border-slate-800 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-400"/> Create Group</h2>
        <input 
          value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Group Name"
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none"
        />
        <button onClick={createGroup} disabled={loading} className="w-full bg-slate-800 py-3 rounded-xl font-bold">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#161F32] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <span className="font-bold">{g.name}</span>
            <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-1 bg-slate-900 rounded">{g.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}