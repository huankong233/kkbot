export const getLoginInfo = async () => {
  return await bot('get_login_info')
}

export const getGroupMemberInfo = async ({ group_id, user_id, no_cache = true }) => {
  return await bot('get_group_member_info', {
    group_id,
    user_id,
    no_cache
  })
}

export const setGroupBan = async ({ group_id, user_id, duration = 1 }) => {
  return await bot('set_group_ban', {
    group_id,
    user_id,
    duration
  })
}
