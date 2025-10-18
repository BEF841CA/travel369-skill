import { z } from 'zod';
import { Travel369Client } from '../../api/client.js';
import { UserRepository } from '../../db/repositories.js';

const client = new Travel369Client();
const userRepo = new UserRepository();

export const scanLoginSchema = z.object({
  type: z.literal('scan-login'),
  params: z.object({
    action: z.enum(['request', 'poll']).optional(),
    scanId: z.string().optional(),
  }),
});

export async function handleScanLogin(input: z.infer<typeof scanLoginSchema>) {
  const { action = 'request', scanId } = input.params;

  if (action === 'request') {
    try {
      const newScanId = await client.requestScanId();
      const qrCodeUrl = `https://jngj.369cx.cn/scanlogin.html?${newScanId}`;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'waiting_for_scan',
              scanId: newScanId,
              qrCodeUrl,
              message: '请使用Travel369手机APP扫描二维码登录',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : '请求扫码失败',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  if (action === 'poll' && scanId) {
    try {
      const result = await client.pollLoginStatus(scanId);
      
      if (result.success && result.user) {
        const user = userRepo.createOrUpdate(
          result.user.uniqueId,
          result.user.token,
          result.user.nickName,
          result.user.phone,
          result.user.headUrl
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: '登录成功',
                user: {
                  uniqueId: user.unique_id,
                  nickname: user.nickname,
                  phone: user.phone,
                  headUrl: user.head_url,
                },
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'waiting',
              message: '等待扫码确认',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : '轮询登录失败',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: '无效的请求参数',
      },
    ],
    isError: true,
  };
}

export const loginStatusSchema = z.object({
  type: z.literal('login-status'),
  params: z.object({}),
});

export async function handleLoginStatus() {
  const user = userRepo.findByToken(client['token'] || '');
  
  if (user) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'logged_in',
            user: {
              uniqueId: user.unique_id,
              nickname: user.nickname,
              phone: user.phone,
            },
          }, null, 2),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          status: 'not_logged_in',
          message: '请先使用 scan-login 工具登录',
        }, null, 2),
      },
    ],
  };
}

export function setApiToken(token: string): void {
  client.setToken(token);
}
