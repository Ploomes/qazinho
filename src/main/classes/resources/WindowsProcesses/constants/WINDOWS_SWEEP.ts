export const WINDOWS_SWEEP = {
  endMark: '__QAZINHO_SWEEP_END__',
  timeoutMs: 10_000,
  script: [
    "$ErrorActionPreference = 'SilentlyContinue'",
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    'while ($null -ne [Console]::In.ReadLine()) {',
    '  Get-CimInstance Win32_Process | ForEach-Object {',
    '    [Console]::Out.WriteLine("$($_.ProcessId)`t$($_.ParentProcessId)`t$($_.KernelModeTime + $_.UserModeTime)`t$($_.WorkingSetSize)`t$($_.Name)`t$($_.CommandLine)")',
    '  }',
    "  [Console]::Out.WriteLine('__QAZINHO_SWEEP_END__')",
    '  [Console]::Out.Flush()',
    '}',
  ].join('\n'),
} as const;
