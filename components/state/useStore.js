// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// const useStore = create(
//   persist(
//     (set, get) => ({
//       user: {
//         name: "",
//         email: "",
//         phone: "",
//         address: "",
//       },
//        petData: null,
//       jwtToken: null,
//       userInfo: null,
//       petInfo: null,
//       petData: null,
//       petEditData: null,
//       previousPath: null,
//       activeStatus: "Lost",
//       adoptionMyPostActiveTab: "Adopt",
//       adoptionFavActiveTab: "Adoption",
//       adoptionMobTab: "Adoption",
//       dogBreeds: [],
//       isDogBreedsFromCache: false,
//       selectedCountryCode: null,
//       selectedCountryName: null,
//       selectedFlagUrl: null,
//       selectedLocation: null,
//       // ✅ Add findMatchesStoredId state
//       findMatchesStoredId: null,
//       sellerLogos: [],

//       // Setters
//             setPetData: (data) => set({ petData: data }),

//       setUser: (userData) => set({ user: userData }),
//       setJwtToken: (token) => set({ jwtToken: token }),
//       setUserInfo: (userInfo) => set({ userInfo }),
//       setPetInfo: (petInfo) => set({ petInfo }),
//       setPetData: (petData) => set({ petData }),
//       setPetEditData: (petEditData) => set({ petEditData }),
//       setPreviousPath: (previousPath) => set({ previousPath }),
//       setActiveStatus: (activeStatus) => set({ activeStatus }),
//       setAdoptionMyPostActiveTab: (adoptionMyPostActiveTab) => set({ adoptionMyPostActiveTab }),
//       setAdoptionFavActiveTab: (adoptionFavActiveTab) => set({ adoptionFavActiveTab }),
//       setAdoptionMobTab: (adoptionMobTab) => set({ adoptionMobTab }),
//       setDogBreeds: (breeds, isFromCache = false) =>
//         set({ dogBreeds: breeds, isDogBreedsFromCache: isFromCache }),
//       setSelectedCountry: ({ code, name, flagUrl }) =>
//         set({ selectedCountryCode: code, selectedCountryName: name, selectedFlagUrl: flagUrl }),
//       setSelectedLocation: (locationLabel) => set({ selectedLocation: locationLabel }),
//       // ✅ Add setter for findMatchesStoredId
//       setFindMatchesStoredId: (id) => set({ findMatchesStoredId: id }),
//   setSellerLogos: (logos) => set({ sellerLogos: logos }),
//       // Getters
//             getPetData: () => get().petData,

//       getJwtToken: () => get().jwtToken,
//       getUserInfo: () => get().userInfo,
//       getPetInfo: () => get().petInfo,
//       getPetData: () => get().petData,
//       getPetEditData: () => get().petEditData,
//       getPreviousPath: () => get().previousPath,
//       getActiveStatus: () => get().activeStatus,
//       getAdoptionMyPostActiveTab: () => get().adoptionMyPostActiveTab,
//       getAdoptionFavActiveTab: () => get().adoptionFavActiveTab,
//       getAdoptionMobTab: () => get().adoptionMobTab,
//       getSelectedCountry: () => ({
//         code: get().selectedCountryCode,
//         name: get().selectedCountryName,
//         flagUrl: get().selectedFlagUrl,
//       }),
//       getSelectedLocation: () => get().selectedLocation,
//       // ✅ Add getter for findMatchesStoredId
//       getFindMatchesStoredId: () => get().findMatchesStoredId,
//  getSellerLogos: () => get().sellerLogos,
//       // Clear all stored data (logout function)
//       clearStore: () =>
//         set({
//           jwtToken: null,
//           userInfo: null,
//           petInfo: null,
//           petData: null,
//           petEditData: null,
//           previousPath: null,
//           activeStatus: "Lost",
//           adoptionMyPostActiveTab: "Adopt",
//           adoptionFavActiveTab: "Adopt",
//           adoptionMobTab: "Adoption",
//           dogBreeds: [],
//           isDogBreedsFromCache: false,
//           selectedCountryCode: null,
//           selectedCountryName: null,
//           selectedFlagUrl: null,
//           selectedLocation: null,
//           // ✅ Reset findMatchesStoredId
//           findMatchesStoredId: null,
//            sellerLogos: [],
//         }),
//     }),
//     {
//       name: "user-store",
//       getStorage: () => localStorage,
//       partialize: (state) => ({
//         petData: state.petData,
//         jwtToken: state.jwtToken,
//         userInfo: state.userInfo,
//         activeStatus: state.activeStatus,
//         adoptionMyPostActiveTab: state.adoptionMyPostActiveTab,
//         adoptionFavActiveTab: state.adoptionFavActiveTab,
//         adoptionMobTab: state.adoptionMobTab,
//         dogBreeds: state.dogBreeds,
//         isDogBreedsFromCache: state.isDogBreedsFromCache,
//         selectedCountryCode: state.selectedCountryCode,
//         selectedCountryName: state.selectedCountryName,
//         selectedFlagUrl: state.selectedFlagUrl,
//         selectedLocation: state.selectedLocation,
//         // ✅ Persist findMatchesStoredId
//         findMatchesStoredId: state.findMatchesStoredId,
//         sellerLogos: state.sellerLogos,
//       }),
//     }
//   )
// );

// export default useStore;

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      user: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      jwtToken: null,
      userInfo: null,
      petInfo: null,
      petData: null,
      selectedPet: null,

      petEditData: null,
      previousPath: null,
      activeStatus: "Lost",
      adoptionMyPostActiveTab: "Adopt",
      adoptionFavActiveTab: "Adoption",
      adoptionMobTab: "Adoption",
      dogBreeds: [],
      isDogBreedsFromCache: false,
      selectedCountryCode: null,
      selectedCountryName: null,
      selectedFlagUrl: null,
      selectedLocation: null,
      // ✅ Add findMatchesStoredId state
      findMatchesStoredId: null,
      // ✅ Add lat / lng state
      lat: null,
      lng: null,

      sellerLogos: [],
      selectedBranchId: null,
      // Settings UI state
      activeTab: "Notifications",
      showMobSettings: true,
      isNotificationOpen: false, // specific to Notifications
      isSettingsDetailOpen: false, // any mobile settings detail screen
      // Breed filter (not persisted, session-only)
      breedFilter: null,
      // PetGenie persisted filters - page-specific
      genieFilters: {
        'genieFilters_pet-names': { petname: "", gender: "", Theme: "", letters: [] },
        'genieFilters_dog-names': { petname: "", gender: "", Theme: "", letters: [] },
        'genieFilters_cat-names': { petname: "", gender: "", Theme: "", letters: [] },
        'genieFilters_fish-names': { petname: "", gender: "", Theme: "", letters: [] },
        'genieFilters_bird-names': { petname: "", gender: "", Theme: "", letters: [] },
        'genieFilters_small-pets-names': { petname: "", gender: "", Theme: "", letters: [] },
      },
      expandedMenus: {},

      // Setters
      setLocation: (lat, lng) => set({ lat, lng }),
      setPetData: (data) => set({ petData: data }),

      setUser: (userData) => set({ user: userData }),
      setJwtToken: (token) => set({ jwtToken: token }),
      setUserInfo: (userInfo) => set((state) => ({
        userInfo: typeof userInfo === "function" ? userInfo(state.userInfo)
          : userInfo,
      })),
      setSelectedPet: (pet) => set({ selectedPet: pet }),

      setPetInfo: (petInfo) => set({ petInfo }),
      // setPetData: (petData) => set({ petData }),
      setPetEditData: (petEditData) => set({ petEditData }),
      setPreviousPath: (previousPath) => set({ previousPath }),
      setActiveStatus: (activeStatus) => set({ activeStatus }),
      setAdoptionMyPostActiveTab: (adoptionMyPostActiveTab) =>
        set({ adoptionMyPostActiveTab }),
      setAdoptionFavActiveTab: (adoptionFavActiveTab) =>
        set({ adoptionFavActiveTab }),
      setAdoptionMobTab: (adoptionMobTab) => set({ adoptionMobTab }),
      setDogBreeds: (breeds, isFromCache = false) =>
        set({ dogBreeds: breeds, isDogBreedsFromCache: isFromCache }),
      setSelectedCountry: ({ code, name, flagUrl }) =>
        set({
          selectedCountryCode: code,
          selectedCountryName: name,
          selectedFlagUrl: flagUrl,
        }),
      setSelectedLocation: (locationLabel) =>
        set({ selectedLocation: locationLabel }),
      // ✅ Add setter for findMatchesStoredId
      setFindMatchesStoredId: (id) => set({ findMatchesStoredId: id }),
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
      setSellerLogos: (logos) => set({ sellerLogos: logos }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowMobSettings: (show) => set({ showMobSettings: show }),
      setIsNotificationOpen: (isOpen) => set({ isNotificationOpen: isOpen }),
      setIsSettingsDetailOpen: (isOpen) => set({ isSettingsDetailOpen: isOpen }),
      setBreedFilter: (filter) => set({ breedFilter: filter }),
      getBreedFilter: () => get().breedFilter,
      getSelectedPet: () => get().selectedPet,
      getSelectedBranchId: () => get().selectedBranchId,
      setExpandedMenus: (valOrFn) => set((state) => ({
        expandedMenus: typeof valOrFn === 'function' ? valOrFn(state.expandedMenus) : valOrFn
      })),

      // PetGenie setters/getters - now supports page-specific filters
      setGenieFilters: (filters) =>
        set((state) => {
          // If filters is an object with page keys, merge it
          // Otherwise, treat it as a single filter object (backward compatibility)
          if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
            const hasPageKeys = Object.keys(filters).some(key => key.startsWith('genieFilters_'));
            if (hasPageKeys) {
              return {
                genieFilters: {
                  ...state.genieFilters,
                  ...filters
                }
              };
            }
          }
          // Backward compatibility - if it's a single filter object, don't update
          return state;
        }),
      getGenieFilters: () => get().genieFilters,
      // Getters
      getPetData: () => get().petData,

      getJwtToken: () => get().jwtToken,
      getUserInfo: () => get().userInfo,
      getPetInfo: () => get().petInfo,
      getPetData: () => get().petData,
      getPetEditData: () => get().petEditData,
      getPreviousPath: () => get().previousPath,
      getActiveStatus: () => get().activeStatus,
      getAdoptionMyPostActiveTab: () => get().adoptionMyPostActiveTab,
      getAdoptionFavActiveTab: () => get().adoptionFavActiveTab,
      getAdoptionMobTab: () => get().adoptionMobTab,
      getActiveTab: () => get().activeTab,
      getShowMobSettings: () => get().showMobSettings,
      getSelectedCountry: () => ({
        code: get().selectedCountryCode,
        name: get().selectedCountryName,
        flagUrl: get().selectedFlagUrl,
      }),
      getSelectedLocation: () => get().selectedLocation,
      // ✅ Add getter for findMatchesStoredId
      getFindMatchesStoredId: () => get().findMatchesStoredId,
      getSellerLogos: () => get().sellerLogos,
      getIsNotificationOpen: () => get().isNotificationOpen,
      getIsSettingsDetailOpen: () => get().isSettingsDetailOpen,
      // Clear all stored data (logout function)
      clearStore: () =>
        set({
          selectedPet: null,

          jwtToken: null,
          userInfo: null,
          lat: null,
          lng: null,
          petInfo: null,
          petData: null,
          petEditData: null,
          previousPath: null,
          activeStatus: "Lost",
          adoptionMyPostActiveTab: "Adopt",
          adoptionFavActiveTab: "Adopt",
          adoptionMobTab: "Adoption",
          dogBreeds: [],
          isDogBreedsFromCache: false,
          selectedCountryCode: null,
          selectedCountryName: null,
          selectedFlagUrl: null,
          selectedLocation: null,
          // ✅ Reset findMatchesStoredId
          findMatchesStoredId: null,
          sellerLogos: [],
          // Reset settings UI state
          activeTab: "Notifications",
          showMobSettings: true,
          isNotificationOpen: false,
          isSettingsDetailOpen: false,
          genieFilters: { petname: "", gender: "", Theme: "", letters: [] },
          selectedBranchId: null,
          expandedMenus: {},
        }),

    }),
    {
      name: "user-store",
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
      partialize: (state) => ({
        selectedPet: state.selectedPet,

        petData: state.petData,
        lat: state.lat,
        lng: state.lng,
        jwtToken: state.jwtToken,
        userInfo: state.userInfo,
        activeStatus: state.activeStatus,
        adoptionMyPostActiveTab: state.adoptionMyPostActiveTab,
        adoptionFavActiveTab: state.adoptionFavActiveTab,
        adoptionMobTab: state.adoptionMobTab,
        dogBreeds: state.dogBreeds,
        isDogBreedsFromCache: state.isDogBreedsFromCache,
        selectedCountryCode: state.selectedCountryCode,
        selectedCountryName: state.selectedCountryName,
        selectedFlagUrl: state.selectedFlagUrl,
        selectedLocation: state.selectedLocation,
        // ✅ Persist findMatchesStoredId
        findMatchesStoredId: state.findMatchesStoredId,
        sellerLogos: state.sellerLogos,
        // settings UI state is not persisted (session-only)
        genieFilters: state.genieFilters,
        selectedBranchId: state.selectedBranchId,
        expandedMenus: state.expandedMenus,
      }),
    }
  )
);

export default useStore;