; MagicIDEA NSIS Installer Hooks
; 自动关闭进程、注册协议、清理注册表

; Kill app and sidecar processes before install/uninstall
!macro KillAppProcesses
  ; 关闭主程序 MagicIDEA.exe
  nsExec::ExecToLog 'taskkill /F /IM "MagicIDEA.exe"'
  ; Kill sidecar (compiled bun binary)
  nsExec::ExecToLog 'taskkill /F /IM "idea-server.exe"'
  ; 等待进程退出
  Sleep 1000
!macroend

; Register magicidea:// deep-link protocol
!macro RegisterDeepLink
  WriteRegStr HKCU "Software\Classes\magicidea" "" "URL:MagicIDEA Protocol"
  WriteRegStr HKCU "Software\Classes\magicidea" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\magicidea\DefaultIcon" "" "$INSTDIR\MagicIDEA.exe,0"
  WriteRegStr HKCU "Software\Classes\magicidea\shell\open\command" "" '"$INSTDIR\MagicIDEA.exe" "%1"'
!macroend

; ==================== HOOKS ====================
; 安装前
!macro NSIS_HOOK_PREINSTALL
  !insertmacro KillAppProcesses
!macroend

; 安装后
!macro NSIS_HOOK_POSTINSTALL
  !insertmacro RegisterDeepLink
!macroend

; 卸载前
!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro KillAppProcesses
!macroend

; 卸载后
!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\magicidea"
!macroend