import { describe, it, expect } from 'vitest';
import { IconMap } from '@/data/icons';

describe('IconMap', () => {
  it('should export IconMap object', () => {
    expect(IconMap).toBeDefined();
    expect(typeof IconMap).toBe('object');
  });

  it('should contain all expected icon keys', () => {
    const expectedKeys = [
      'Bolt',
      'X',
      'droplet',
      'flame',
      'Wifi',
      'Question',
      'Border',
      'Search',
      'LogOut',
      'Camera',
      'pin',
      'plus',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'building',
      'edit',
      'back',
      'grid',
      'info',
      'add',
      'trash',
      'save',
      'list',
      'image',
      'document',
      'attachment',
    ];

    expectedKeys.forEach((key) => {
      expect(IconMap).toHaveProperty(key);
    });
  });

  it('should have function components as values', () => {
    Object.entries(IconMap).forEach(([key, IconComponent]) => {
      expect(typeof IconComponent).toBe('function');
    });
  });

  it('should have Bolt icon', () => {
    expect(IconMap.Bolt).toBeDefined();
    expect(typeof IconMap.Bolt).toBe('function');
  });

  it('should have X icon', () => {
    expect(IconMap.X).toBeDefined();
    expect(typeof IconMap.X).toBe('function');
  });

  it('should have droplet icon', () => {
    expect(IconMap.droplet).toBeDefined();
    expect(typeof IconMap.droplet).toBe('function');
  });

  it('should have flame icon', () => {
    expect(IconMap.flame).toBeDefined();
    expect(typeof IconMap.flame).toBe('function');
  });

  it('should have Search icon', () => {
    expect(IconMap.Search).toBeDefined();
    expect(typeof IconMap.Search).toBe('function');
  });

  it('should have numbered icons 1-9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(IconMap[i.toString()]).toBeDefined();
      expect(typeof IconMap[i.toString()]).toBe('function');
    }
  });

  it('should have utility icons', () => {
    const utilityIcons = ['edit', 'trash', 'save', 'add', 'info'];

    utilityIcons.forEach((iconKey) => {
      expect(IconMap[iconKey]).toBeDefined();
      expect(typeof IconMap[iconKey]).toBe('function');
    });
  });

  it('should have file/document related icons', () => {
    const fileIcons = ['image', 'document', 'attachment', 'list'];

    fileIcons.forEach((iconKey) => {
      expect(IconMap[iconKey]).toBeDefined();
      expect(typeof IconMap[iconKey]).toBe('function');
    });
  });

  it('should have navigation icons', () => {
    const navIcons = ['back', 'LogOut', 'pin'];

    navIcons.forEach((iconKey) => {
      expect(IconMap[iconKey]).toBeDefined();
      expect(typeof IconMap[iconKey]).toBe('function');
    });
  });

  it('should not have undefined values', () => {
    Object.entries(IconMap).forEach(([key, value]) => {
      expect(value).not.toBeUndefined();
    });
  });

  it('should not have null values', () => {
    Object.entries(IconMap).forEach(([key, value]) => {
      expect(value).not.toBeNull();
    });
  });

  it('should return an icon component that can be rendered', () => {
    // Test that we can get an icon component
    const SearchIcon = IconMap.Search;
    expect(SearchIcon).toBeDefined();

    // Icon components from react-icons are functions
    expect(typeof SearchIcon).toBe('function');
  });

  it('should have consistent casing for some icons', () => {
    // Some icons use PascalCase
    expect(IconMap.Bolt).toBeDefined();
    expect(IconMap.X).toBeDefined();
    expect(IconMap.Search).toBeDefined();
    expect(IconMap.Question).toBeDefined();
  });

  it('should have lowercase keys for some icons', () => {
    // Some icons use lowercase
    expect(IconMap.droplet).toBeDefined();
    expect(IconMap.flame).toBeDefined();
    expect(IconMap.pin).toBeDefined();
    expect(IconMap.plus).toBeDefined();
  });

  it('should have building and grid icons for UI', () => {
    expect(IconMap.building).toBeDefined();
    expect(IconMap.grid).toBeDefined();
  });

  it('should be accessible via string indexing', () => {
    const iconKey = 'Search';
    const IconComponent = IconMap[iconKey];

    expect(IconComponent).toBeDefined();
    expect(typeof IconComponent).toBe('function');
  });

  it('should handle dynamic icon lookup', () => {
    const iconNames = ['Bolt', 'flame', 'Search', '1', 'edit'];

    iconNames.forEach((name) => {
      const icon = IconMap[name];
      expect(icon).toBeDefined();
      expect(typeof icon).toBe('function');
    });
  });

  it('should return undefined for non-existent icon keys', () => {
    const nonExistentIcon = IconMap['NonExistentIcon'];
    expect(nonExistentIcon).toBeUndefined();
  });

  it('should have exactly the expected number of icons', () => {
    const iconCount = Object.keys(IconMap).length;
    expect(iconCount).toBe(33); // Current count of icons in IconMap
  });

  it('should have Camera icon for photo features', () => {
    expect(IconMap.Camera).toBeDefined();
  });

  it('should have Wifi icon', () => {
    expect(IconMap.Wifi).toBeDefined();
  });

  it('should have Border icon for map boundaries', () => {
    expect(IconMap.Border).toBeDefined();
  });

  it('should support equipment type icons', () => {
    // Icons commonly used for equipment types
    const equipmentIcons = ['Bolt', 'droplet', 'flame', 'Wifi'];

    equipmentIcons.forEach((iconKey) => {
      expect(IconMap[iconKey]).toBeDefined();
    });
  });
});
