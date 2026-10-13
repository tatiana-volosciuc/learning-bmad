import axiosClient from './axiosClient'

export const deleteAccount = () => axiosClient.delete('/account')

export const exportAccountData = () => axiosClient.get('/account/export')
