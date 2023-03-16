import { executeSQL } from '@/sqls'
import type { SessionPayload, SessionData, RecordData } from '@/types'
import { useRoleStore } from './role'

// 用来管理当前会话的状态
export const useSessionStore = defineStore(
  'sessionStore',
  () => {
    // 当前会话
    const currentSession = ref<SessionPayload>()
    // 当前会话数据列表
    const sessionDataList = ref<SessionData[]>([])
    // 所有会话列表
    const sessionList = ref<SessionPayload[]>([])
    // 请求发送状态
    const isThinking = ref(false)
    // 是否显示历史
    const showHistory = ref(false)

    watch(showHistory, (val) => {
      if (val) getSessionList()
    })

    const getSessionList = async () => {
      const sql = 'SELECT * FROM session;'
      sessionList.value = (await executeSQL(sql)) as SessionPayload[]
    }

    const createNewSession = () => {
      currentSession.value = {
        id: crypto.randomUUID(),
        title: '',
        role_id: 0
      }
    }

    const getSessionData = async () => {
      if (!currentSession.value) return

      const sql = `SELECT * FROM session_data WHERE session_id = '${currentSession.value.id}';`
      sessionDataList.value = (await executeSQL(sql)) as SessionData[]
    }

    const checkSessionExist = async () => {
      if (!currentSession.value) return

      const sql = `SELECT * FROM session WHERE id = '${currentSession.value.id}';`
      const result = (await executeSQL(sql)) as SessionPayload[]
      return result.length > 0
    }

    const { changeCurrentRole, currentRole } = useRoleStore()

    const addSessionData = async (
      type: 'ask' | 'answer',
      data: RecordData[]
    ) => {
      if (!currentSession.value) return
      // 检查会话是否已经存在
      const isExist = await checkSessionExist()

      if (!isExist) {
        const sql = `INSERT INTO session (id, title, role_id) VALUES ('${currentSession.value.id}', '${data[1].content}', '${currentRole?.id}');`
        executeSQL(sql)
      }

      const sql = `INSERT INTO session_data (session_id,type, messages) VALUES (
        '${currentSession.value.id}','${type}', '${JSON.stringify(data)}');`

      executeSQL(sql)
      getSessionData()
    }

    // 新建或切换会话
    const switchSession = (session?: SessionPayload) => {
      if (!session) createNewSession()
      else {
        currentSession.value = session
        changeCurrentRole(session.role_id)
      }
      getSessionData()
    }

    onMounted(() => switchSession())

    return {
      currentSession,
      sessionDataList,
      isThinking,
      sessionList,
      showHistory,
      addSessionData,
      switchSession
    }
  },
  {
    persist: {
      paths: ['currentSession']
    }
  }
)