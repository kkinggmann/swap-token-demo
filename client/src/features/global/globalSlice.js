import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  selectedAddress: "",
  tokenList: [],
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    resetState: () => {
      return initialState;
    },
    setAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    addTokenToList: (state, action) => {
      const token = action.payload;
      const tokenIndex = state.tokenList.findIndex(
        (t) => t.value === token.value
      );

      if (tokenIndex === -1) {
        state.tokenList.push(token);
      }
    },
  },
  extraReducers: (builder) => {},
});

export const {resetState, setAddress, addTokenToList} = globalSlice.actions;

export const globalState = (state) => state.global;

export default globalSlice.reducer;
