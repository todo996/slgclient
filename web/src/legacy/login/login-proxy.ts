export type LoginData = {
  uid?: string | number;
  session?: string;
  [key: string]: unknown;
};

export type RoleData = {
  rid: number;
  uid: number;
  nickName: string;
  sex: number;
  sid: number;
  balance: number;
  headId: number;
  profile: string;
};

export class LoginProxy {
  private loginData: LoginData | null = null;
  private roleData: RoleData | null = null;
  private roleResData: unknown = null;
  private token = "";

  serverId = 0;

  clear(): void {
    this.loginData = null;
    this.roleData = null;
    this.roleResData = null;
    this.token = "";
  }

  saveEnterData(data: Record<string, any>): void {
    if (data.role) {
      this.setRoleData(data.role as Record<string, any>);
    }

    if (data.role_res) {
      this.roleResData = data.role_res;
    }

    if (typeof data.token === "string") {
      this.token = data.token;
    }
  }

  setRoleData(data: Record<string, any>): void {
    this.roleData = {
      rid: Number(data.rid ?? 0),
      uid: Number(data.uid ?? 0),
      nickName: String(data.nickName ?? ""),
      sex: Number(data.sex ?? 0),
      sid: Number(data.sid ?? 0),
      balance: Number(data.balance ?? 0),
      headId: Number(data.headId ?? 0),
      profile: String(data.profile ?? ""),
    };
  }

  getRoleData(): RoleData | null {
    return this.roleData;
  }

  getRoleResData(): unknown {
    return this.roleResData;
  }

  saveLoginData(data: LoginData): void {
    this.loginData = data;
  }

  getLoginData(): LoginData | null {
    return this.loginData;
  }

  getToken(): string {
    return this.token;
  }

  getSession(): string {
    return this.loginData?.session ?? "";
  }
}
