import { create } from 'zustand';

export type ProfileAssetTab = 'overview' | 'fund' | 'spot' | 'futures';

type ProfileUiState = {
  profileAssetTab: ProfileAssetTab;
  setProfileAssetTab: (profileAssetTab: ProfileAssetTab) => void;
  resetProfileAssetTab: () => void;
};

export const useProfileUiStore = create<ProfileUiState>((set) => ({
  profileAssetTab: 'overview',
  setProfileAssetTab: (profileAssetTab) => set({ profileAssetTab }),
  resetProfileAssetTab: () => set({ profileAssetTab: 'overview' }),
}));
