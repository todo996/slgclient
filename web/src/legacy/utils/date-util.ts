export class DateUtil {
  private static serverTime = 0;
  private static receivedAt = 0;

  static setServerTime(time: number): void {
    DateUtil.serverTime = time;
    DateUtil.receivedAt = Date.now();
  }

  static getServerTime(): number {
    if (DateUtil.receivedAt === 0) {
      return Date.now();
    }

    return (
      Date.now() -
      DateUtil.receivedAt +
      DateUtil.serverTime
    );
  }
}
