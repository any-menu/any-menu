import { global_setting } from "../../../Core/shared/setting";

export function initApi() {
  global_setting.platform = 'browser'

  global_setting.api.readFolder = async (relPath: string, recursion_depth?: number): Promise<string[]> => {
    return []
  }

  global_setting.api.readFile = async (relPath: string): Promise<string | null> => {
    return null
  }

  global_setting.api.writeFile = async (relPath: string, content: string, _isappend?: boolean): Promise<boolean> => {
    return false
  }
}
