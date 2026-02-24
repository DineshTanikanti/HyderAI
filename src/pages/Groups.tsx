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

    // IF THERE IS AN ERROR, SHOW THE EXACT DATABASE MESSAGE
    if (gError) {
      alert(`Database Error: ${gError.message}`);
      console.error("Supabase Error Details:", gError);
      setLoading(false);
      return;
    }

    // If group creation succeeds, add the user as a member
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