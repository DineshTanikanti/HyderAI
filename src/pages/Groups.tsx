import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useHydrationStore } from '../lib/hydration-store';
import { Users, Plus, UserPlus, ArrowRight, Trophy, Droplets } from 'lucide-react';

export default function Groups() {
  const { user } = useHydrationStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
      const groupIds = myMemberships?.map(m => m.group_id) || [];
      if (groupIds.length === 0) return;

      const { data: groupsData } = await supabase.from('groups').select('*, group_members(user_id)').in('id', groupIds);
      const memberIds = [...new Set(groupsData?.flatMap(g => g.group_members.map((m: any) => m.user_id)) || [])];

      const today = new Date().toISOString().split('T')[0];
      const [profilesRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, daily_goal').in('id', memberIds),
        supabase.from('water_logs').select('user_id, amount').gte('created_at', today).in('user_id', memberIds)
      ]);

      const intakes = (logsRes.data || []).reduce((acc: any, log: any) => {
        acc[log.user_id] = (acc[log.user_id] || 0) + log.amount;
        return acc;
      }, {});

      const formattedGroups = groupsData?.map(g => {
        const members = g.group_members.map((m: any) => {
          const p = (profilesRes.data || []).find(p => p.id === m.user_id);
          const intake = intakes[m.user_id] || 0;
          const goal = p?.daily_goal || 2500;
          return { 
            name: p?.full_name?.split(' ')[0] || 'Member', 
            intake, 
            percentage: Math.min(100, Math.round((intake / goal) * 100)),
            isMe: m.user_id === user.id 
          };
        }).sort((a: any, b: any) => b.percentage - a.percentage);
        return { ...g, members };
      });
      setGroups(formattedGroups || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const createGroup = async () => {
    if (!newGroupName || !user) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: group } = await supabase.from('groups').insert([{ 
      name: newGroupName, group_name: newGroupName, code: code, group_code: code, created_by: user.id 
    }]).select().single();
    if (group) {
      await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      setNewGroupName('');
      fetchGroups();
    }
    setLoading(false);
  };

  const joinGroup = async () => {
    if (!joinCode || !user) return;
    const { data: group } = await supabase.from('groups').select('id').eq('code', joinCode.toUpperCase()).single();
    if (group) {
      const { error } = await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      if (!error) { setJoinCode(''); fetchGroups(); }
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      <header className="flex items-center gap-3 pt-2">
        <Users className="text-indigo-500 w-8 h-8" />
        <h1 className="font-black text-xl">Family Groups</h1>
      </header>

      <div className="grid gap-4">
        <div className="bg-[#161F32] p-5 rounded-3xl border border-slate-800">
          <h2 className="text-sm font-bold mb-3">Join Group</h2>
          <div className="flex gap-2">
            <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="6-digit code" className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none" />
            <button onClick={joinGroup} className="bg-indigo-500 px-4 rounded-xl"><ArrowRight/></button>
          </div>
        </div>
        <div className="bg-[#161F32] p-5 rounded-3xl border border-slate-800">
          <h2 className="text-sm font-bold mb-3">Create Group</h2>
          <div className="flex gap-2">
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name" className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none" />
            <button onClick={createGroup} className="bg-slate-800 px-4 rounded-xl font-bold">{loading ? '...' : 'Create'}</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.id} className="bg-[#161F32] rounded-3xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-800/50 p-4 flex justify-between items-center">
              <h3 className="font-bold">{g.group_name || g.name} (Code: {g.code})</h3>
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="p-4 space-y-4">
              {g.members.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-4">{i+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={m.isMe ? "text-cyan-400 font-bold" : ""}>{m.name}</span>
                      <span>{m.intake}ml ({m.percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${m.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}