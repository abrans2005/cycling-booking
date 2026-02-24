// Server酱 消息推送服务
// 文档：https://sct.ftqq.com/
// 支持：微信、企业微信、钉钉、飞书等多种渠道

const SERVER_CHAN_API = 'https://sctapi.ftqq.com';

export interface ServerChanResponse {
  code: number;
  message: string;
  data?: {
    pushid: string;
    readkey: string;
    error: string;
    errno: number;
  };
}

// 发送模板消息
export const sendServerChanMessage = async (
  sendkey: string,
  title: string,
  content?: string,
  options?: {
    short?: string;  // 简短描述，用于微信消息列表
    noip?: number;   // 是否隐藏调用IP，1为隐藏
  }
): Promise<boolean> => {
  if (!sendkey) {
    console.error('Server酱 SendKey 未配置');
    return false;
  }

  try {
    const url = `${SERVER_CHAN_API}/${sendkey}.send`;
    
    const body: Record<string, string> = {
      title,
      ...(content && { desp: content }),
      ...(options?.short && { short: options.short }),
      ...(options?.noip !== undefined && { noip: options.noip.toString() }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });

    const result: ServerChanResponse = await response.json();

    if (result.code === 0) {
      console.log('Server酱消息发送成功:', result.data?.pushid);
      return true;
    } else {
      console.error('Server酱消息发送失败:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Server酱请求失败:', error);
    return false;
  }
};

// 预约通知模板
export const sendBookingNotification = async (
  sendkey: string,
  booking: {
    memberName: string;
    memberPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    stationId: number;
    bikeModel?: string;
    price: number;
    notes?: string;
  }
): Promise<boolean> => {
  const title = `📅 新预约：${booking.memberName}`;
  
  const content = [
    `**预约人**：${booking.memberName}`,
    `**手机号**：${booking.memberPhone}`,
    `**预约日期**：${booking.date}`,
    `**时间段**：${booking.startTime} - ${booking.endTime}`,
    `**骑行台**：${booking.stationId}号${booking.bikeModel ? ` (${booking.bikeModel})` : ''}`,
    `**预计收入**：¥${booking.price}`,
    ...(booking.notes ? [`**备注**：${booking.notes}`] : []),
    '',
    `---`,
    `⏰ 发送时间：${new Date().toLocaleString('zh-CN')}`,
  ].join('\n\n');

  return sendServerChanMessage(sendkey, title, content, {
    short: `${booking.memberName} 预约了 ${booking.date} ${booking.startTime} 的骑行台`,
  });
};

// 取消预约通知
export const sendCancelNotification = async (
  sendkey: string,
  booking: {
    memberName: string;
    memberPhone: string;
    date: string;
    startTime: string;
    stationId: number;
  }
): Promise<boolean> => {
  const title = `❌ 预约取消：${booking.memberName}`;
  
  const content = [
    `**预约人**：${booking.memberName}`,
    `**手机号**：${booking.memberPhone}`,
    `**预约日期**：${booking.date}`,
    `**时间段**：${booking.startTime}`,
    `**骑行台**：${booking.stationId}号`,
    '',
    `---`,
    `⏰ 取消时间：${new Date().toLocaleString('zh-CN')}`,
  ].join('\n\n');

  return sendServerChanMessage(sendkey, title, content);
};
