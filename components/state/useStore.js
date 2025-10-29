import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      user: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
       petData: null,
      jwtToken: null,
      userInfo: null,
      petInfo: null,
      petData: null,
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
      sellerLogos: [],

      // Setters
            setPetData: (data) => set({ petData: data }),

      setUser: (userData) => set({ user: userData }),
      setJwtToken: (token) => set({ jwtToken: token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      setPetInfo: (petInfo) => set({ petInfo }),
      setPetData: (petData) => set({ petData }),
      setPetEditData: (petEditData) => set({ petEditData }),
      setPreviousPath: (previousPath) => set({ previousPath }),
      setActiveStatus: (activeStatus) => set({ activeStatus }),
      setAdoptionMyPostActiveTab: (adoptionMyPostActiveTab) => set({ adoptionMyPostActiveTab }),
      setAdoptionFavActiveTab: (adoptionFavActiveTab) => set({ adoptionFavActiveTab }),
      setAdoptionMobTab: (adoptionMobTab) => set({ adoptionMobTab }),
      setDogBreeds: (breeds, isFromCache = false) =>
        set({ dogBreeds: breeds, isDogBreedsFromCache: isFromCache }),
      setSelectedCountry: ({ code, name, flagUrl }) =>
        set({ selectedCountryCode: code, selectedCountryName: name, selectedFlagUrl: flagUrl }),
      setSelectedLocation: (locationLabel) => set({ selectedLocation: locationLabel }),
      // ✅ Add setter for findMatchesStoredId
      setFindMatchesStoredId: (id) => set({ findMatchesStoredId: id }),
  setSellerLogos: (logos) => set({ sellerLogos: logos }),
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
      getSelectedCountry: () => ({
        code: get().selectedCountryCode,
        name: get().selectedCountryName,
        flagUrl: get().selectedFlagUrl,
      }),
      getSelectedLocation: () => get().selectedLocation,
      // ✅ Add getter for findMatchesStoredId
      getFindMatchesStoredId: () => get().findMatchesStoredId,
 getSellerLogos: () => get().sellerLogos,
      // Clear all stored data (logout function)
      clearStore: () =>
        set({
          jwtToken: null,
          userInfo: null,
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
        }),
    }),
    {
      name: "user-store",
      getStorage: () => localStorage,
      partialize: (state) => ({
        petData: state.petData,
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
      }),
    }
  )
);

export default useStore;