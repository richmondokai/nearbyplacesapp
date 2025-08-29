export type RootStackParamList = {
  NearbyPlaces: undefined;
  PlaceDetails: {
    placeId: string;
    placeName: string;
  };
};

export type RootStackNavigationProp = {
  navigate: (screen: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
  push: (screen: keyof RootStackParamList, params?: any) => void;
  pop: () => void;
  popToTop: () => void;
};

export type PlaceDetailsRouteProp = {
  params: {
    placeId: string;
    placeName: string;
  };
};
