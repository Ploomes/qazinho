import { describe, expect, it } from 'vitest';
import { describeIosScreen } from '@/main/classes/devices/IosDriver/library';

const ELEMENTS = [
  { label: 'Settings', role: 'StaticText', x: 10, y: 10 },
  { label: 'Wi-Fi', role: 'Button', x: 20, y: 20 },
  { label: '', role: 'Other', x: 30, y: 30 },
];

describe('describeIosScreen', () => {
  it('says which app is in front and what it reads', () => {
    const said = describeIosScreen({ elements: ELEMENTS, app: 'com.apple.Preferences' });

    expect(said).toContain('APP: com.apple.Preferences');
    expect(said).toContain('Wi-Fi');
    expect(said).toContain('button: Wi-Fi');
  });

  it('leaves out what has nothing written on it', () => {
    const said = describeIosScreen({ elements: ELEMENTS, app: 'com.example' });

    expect(said).not.toContain('other:');
  });

  it('an empty screen is still described, so the agent knows it is empty', () => {
    expect(describeIosScreen({ elements: [], app: 'com.example' })).toBe(
      'APP: com.example\nTEXT:\n\nCONTROLS:',
    );
  });
});
