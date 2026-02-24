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
      // 1. Find which groups the user is in
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = myMemberships?.map(m => m.group_id) || [];
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      // 2. Fetch the Groups and ALL their members
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*, group_members(user_id)')
        .in('id', groupIds);

      // 3. Get unique IDs of everyone in these groups
      const memberIds = [...new Set(groupsData?.flatMap(g => g.group_members.map((m: any) => m.user_id)) || [])];

      // 4. Fetch their Profiles and Today's Water Logs
      const today = new Date().toISOString().split('T')[0];
      const [profilesRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, daily_goal').in('id', memberIds),
        supabase.from('water_logs').select('user_id, amount').gte('created_at', today).in('user_id', memberIds)
      ]);

      const profiles = profilesRes.data || [];
      const logs = logsRes.data || [];

      // 5. Add up everyone's water for today
      const intakes = logs.reduce((acc: any, log: any) => {
        acc[log.user_id] = (acc[log.user_id] || 0) + log.amount;
        return acc;
      }, {});

      // 6. Build the Leaderboard Data
      const formattedGroups = groupsData?.map(g => {
        const members = g.group_members.map((m: any) => {
          const profile = profiles.find(p => p.id === m.user_id);
          const intake = intakes[m.user_id] || 0;
          const goal = profile?.daily_goal || 2500;
          // Use "Guest" if no profile name is set yet
          const name = profile?.full_name?.split(' ')[0] || 'Guest';
          const percentage = Math.min(100, Math.round((intake / goal) * 100));
          
          return { id: m.user_id, name, intake, percentage, isMe: m.user_id === user.id };
        }).sort((a: any, b: any) => b.percentage - a.percentage); // Sort highest to lowest!

        return { ...g, members };
      });

      setGroups(formattedGroups || []);
    } catch (error) {
      console.error("Error fetching group leaderboards:", error);
    }
  };

  useEffect(() => { 
    fetchGroups(); 
  }, [user]);

  const createGroup = async () => {
    if (!newGroupName || !user) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: group, error: gError } = await supabase
      .from('groups')
      .insert([{ name: newGroupName, group_name: newGroupName, group_code: code, code: code, created_by: user.id }])
      .select()
      .single();

    if (!gError && group) {
      await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      setNewGroupName('');
      await fetchGroups();
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
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50 font-sans">
      <header className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Users className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tight">Social Groups</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hydrate Together</p>
        </div>
      </header>

      {/* Join & Create Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161F32] p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200"><UserPlus className="w-4 h-4 text-indigo-400"/> Join Team</h2>
          <div className="flex gap-2">
            <input 
              value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="flex-1 bg-slate-900/50 border border-slate-700/50 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
            <button onClick={joinGroup} className="bg-indigo-500 px-4 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/20"><ArrowRight className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="bg-[#161F32] p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200"><Plus className="w-4 h-4 text-indigo-400"/> Create Family</h2>
          <div className="flex gap-2">
            <input 
              value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Fit Fam"
              className="flex-1 bg-slate-900/50 border border-slate-700/50 p-3 text-sm rounded-xl outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
            <button onClick={createGroup} disabled={loading} className="bg-slate-800 px-4 rounded-xl font-bold text-sm active:scale-95 transition-all hover:bg-slate-700">
              {loading ? '...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* The Live Leaderboards */}
      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.id} className="bg-[#161F32] rounded-[32px] border border-slate-800/80 shadow-2xl overflow-hidden">
            {/* Group Header */}
            <div className="bg-slate-800/30 p-5 border-b border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-white">{g.group_name || g.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  Invite Code: <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{g.code}</span>
                </p>
              </div>
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                <Trophy className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {/* Members List */}
            <div className="p-5 space-y-4">
              {g.members.map((member: any, index: number) => (
                <div key={member.id} className="relative flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${index === 0 ? 'bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/20' : index === 1 ? 'bg-slate-300 text-slate-800' : index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-500'}`}>
                    {index + 1}
                  </div>
                  
                  {/* Member Progress */}
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="font-bold text-sm flex items-center gap-2">
                        {member.name} {member.isMe && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase">You</span>}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400"><span className="text-cyan-400">{member.intake}ml</span> / {member.percentage}%</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${member.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="p-8 text-center bg-slate-800/10 border-2 border-dashed border-slate-800/80 rounded-[32px]">
            <Droplets className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">You aren't in any groups yet.<br/>Create or join one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}