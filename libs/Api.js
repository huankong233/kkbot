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

export const setFriendAddRequest = async ({ flag, approve }) => {
  return await bot('set_friend_add_request', {
    flag,
    approve
  })
}

export const setGroupAddRequest = async ({ flag, sub_type, approve, reason = '' }) => {
  return await bot('set_group_add_request', {
    flag,
    sub_type,
    approve,
    reason
  })
}

export const getStrangerInfo = async ({ user_id }) => await bot('get_stranger_info', { user_id })

export const getFriendList = async () => await bot('get_friend_list')

export const isFriend = async ({ user_id }) => {
  const friendList = await getFriendList()
  return friendList.data.find(datum => datum.user_id === user_id)
}

export const deleteMsg = async ({ message_id }) => {
  await bot('delete_msg', {
    message_id
  })
}
