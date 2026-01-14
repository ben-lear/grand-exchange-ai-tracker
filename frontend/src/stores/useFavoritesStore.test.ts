/**
 * Tests for useFavoritesStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from './useFavoritesStore';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFavoritesStore.setState({ favorites: {} });
  });

  const mockItem1 = {
    itemId: 1,
    name: 'Abyssal whip',
    iconUrl: 'https://example.com/icon1.png',
  };

  const mockItem2 = {
    itemId: 2,
    name: 'Dragon scimitar',
    iconUrl: 'https://example.com/icon2.png',
  };

  describe('Initial State', () => {
    it('should start with empty favorites', () => {
      const state = useFavoritesStore.getState();
      expect(state.favorites).toEqual({});
      expect(state.getFavoritesCount()).toBe(0);
    });
  });

  describe('addFavorite', () => {
    it('should add a favorite item', () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      
      const state = useFavoritesStore.getState();
      expect(state.favorites[1]).toBeDefined();
      expect(state.favorites[1].itemId).toBe(1);
      expect(state.favorites[1].name).toBe('Abyssal whip');
      expect(state.favorites[1].addedAt).toBeGreaterThan(0);
    });

    it('should add multiple favorite items', () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      addFavorite(mockItem2);
      
      const state = useFavoritesStore.getState();
      expect(Object.keys(state.favorites).length).toBe(2);
      expect(state.getFavoritesCount()).toBe(2);
    });

    it('should update existing favorite if added again', () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      const firstAddedAt = useFavoritesStore.getState().favorites[1].addedAt;
      
      // Wait a tiny bit and add again
      addFavorite(mockItem1);
      const secondAddedAt = useFavoritesStore.getState().favorites[1].addedAt;
      
      expect(secondAddedAt).toBeGreaterThanOrEqual(firstAddedAt);
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite item', () => {
      const { addFavorite, removeFavorite } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      expect(useFavoritesStore.getState().favorites[1]).toBeDefined();
      
      removeFavorite(1);
      expect(useFavoritesStore.getState().favorites[1]).toBeUndefined();
    });

    it('should not error when removing non-existent item', () => {
      const { removeFavorite } = useFavoritesStore.getState();
      expect(() => removeFavorite(999)).not.toThrow();
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite if not already favorited', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      toggleFavorite(mockItem1);
      
      const state = useFavoritesStore.getState();
      expect(state.favorites[1]).toBeDefined();
    });

    it('should remove favorite if already favorited', () => {
      const { toggleFavorite } = useFavoritesStore.getState();
      toggleFavorite(mockItem1);
      expect(useFavoritesStore.getState().favorites[1]).toBeDefined();
      
      toggleFavorite(mockItem1);
      expect(useFavoritesStore.getState().favorites[1]).toBeUndefined();
    });
  });

  describe('isFavorite', () => {
    it('should return false for non-favorited item', () => {
      const { isFavorite } = useFavoritesStore.getState();
      expect(isFavorite(1)).toBe(false);
    });

    it('should return true for favorited item', () => {
      const { addFavorite, isFavorite } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      expect(isFavorite(1)).toBe(true);
    });
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites', () => {
      const { getFavorites } = useFavoritesStore.getState();
      expect(getFavorites()).toEqual([]);
    });

    it('should return array of favorite items', () => {
      const { addFavorite, getFavorites } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      addFavorite(mockItem2);
      
      const favorites = getFavorites();
      expect(favorites.length).toBe(2);
      expect(favorites[0].itemId).toBe(1);
      expect(favorites[1].itemId).toBe(2);
    });

    it('should return favorites sorted by addedAt descending', async () => {
      const { addFavorite, getFavorites } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      addFavorite(mockItem2);
      
      const favorites = getFavorites();
      // Most recently added should be first
      expect(favorites[0].itemId).toBe(2);
      expect(favorites[1].itemId).toBe(1);
    });
  });

  describe('getFavoritesCount', () => {
    it('should return 0 for no favorites', () => {
      const { getFavoritesCount } = useFavoritesStore.getState();
      expect(getFavoritesCount()).toBe(0);
    });

    it('should return correct count', () => {
      const { addFavorite, getFavoritesCount } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      expect(getFavoritesCount()).toBe(1);
      
      addFavorite(mockItem2);
      expect(getFavoritesCount()).toBe(2);
    });
  });

  describe('clearFavorites', () => {
    it('should remove all favorites', () => {
      const { addFavorite, clearFavorites, getFavoritesCount } = useFavoritesStore.getState();
      addFavorite(mockItem1);
      addFavorite(mockItem2);
      expect(getFavoritesCount()).toBe(2);
      
      clearFavorites();
      expect(getFavoritesCount()).toBe(0);
      expect(useFavoritesStore.getState().favorites).toEqual({});
    });
  });
});
