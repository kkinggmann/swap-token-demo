import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    resetState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {},
});

export const {resetState} = globalSlice.actions;

export const globalState = (state) => state.global;

export default globalSlice.reducer;
