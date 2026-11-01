#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

[Setup]
AppId={{C47F819A-B23E-4952-A361-9E8B561CD098}
AppName=Remote Control
AppVersion={#AppVersion}
AppPublisher=Mohamed
AppPublisherURL=https://github.com/mohamedjs/remote-control
DefaultDirName={autopf}\RemoteControl
DefaultGroupName=Remote Control
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=..\..\dist
OutputBaseFilename=RemoteControl-Setup-{#AppVersion}
SetupIconFile=..\icons\remote-control.ico
UninstallDisplayIcon={app}\remote-control.cmd
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"

[Tasks]
Name: "autostart"; Description: "Start Remote Control when I sign in"; GroupDescription: "Startup:"
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\..\dist\remote-control\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Remote Control"; Filename: "{app}\remote-control.cmd"; Parameters: "run"
Name: "{group}\Remote Control Dashboard"; Filename: "{app}\remote-control.cmd"; Parameters: "dashboard"
Name: "{group}\Uninstall Remote Control"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Remote Control"; Filename: "{app}\remote-control.cmd"; Parameters: "dashboard"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "RemoteControl"; \
  ValueData: """{app}\remote-control.cmd"" run --no-window"; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\remote-control.cmd"; Parameters: "dashboard"; Description: "Open Remote Control Dashboard now"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /IM node.exe /FI ""WINDOWTITLE eq Remote Control*"" /F"; Flags: runhidden; RunOnceId: "StopRemoteControl"
