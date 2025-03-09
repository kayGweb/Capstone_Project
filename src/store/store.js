import { configureStore } from "@reduxjs/toolkit";
import provider from "./reducers/provider";
import tokens from "./reducers/tokens";
import nfts from "./reducers/nft";

export const store = configureStore({
	reducer: {
		provider,
		tokens,
		nfts
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these action types
				ignoredActions: ['nfts/setNft'],
				// Ignore these field paths in all actions
				ignoredActionPaths: ['payload.connection', 'payload.nft'],
				// Ignore these paths in the state
				ignoredPaths: ['nfts.nft', 'provider.connection'],
			},
			thunk: true
		})
});

export default store;
