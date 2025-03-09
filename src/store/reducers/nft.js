import { createSlice } from "@reduxjs/toolkit";

const nftSlice = createSlice({
	name: "nfts",
	initialState: [],
	reducers: {
		setNft: (state, action) => {
			state.nft = action.payload;
		},
		setBaseUri: (state, action) => {
			state.baseUri = action.payload;
		},
		setNftMintDate: (state, action) => {
			state.nftMintDate = action.payload;
		}
	}
});

export const { setNft, setBaseUri, setNftMintDate } = nftSlice.actions;
export default nftSlice.reducer;
