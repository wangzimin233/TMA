import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 交易对符号格式转换工具
 */
export const symbolFormat = {
  /**
   * 前端格式转API格式
   * @example "BTC/USDT" -> "BTCUSDT"
   */
  toApi: (symbol: string): string => {
    return symbol.replace('/', '').replace(/\s/g, '');
  },

  /**
   * API格式转前端格式
   * @example "BTCUSDT" -> "BTC/USDT"
   */
  fromApi: (symbol: string): string => {
    // 匹配常见计价币种
    const match = symbol.match(/^(\w+?)(USDT|USDC|BTC|ETH|BNB|BUSD)$/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return symbol;
  },

  /**
   * 标准化前端格式（确保有斜杠）
   * @example "BTCUSDT" -> "BTC/USDT", "BTC/USDT" -> "BTC/USDT"
   */
  normalize: (symbol: string): string => {
    if (symbol.includes('/')) return symbol;
    return symbolFormat.fromApi(symbol);
  }
};
