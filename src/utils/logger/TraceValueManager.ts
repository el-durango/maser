import type { Guild, TextBasedChannels, User } from "discord.js";

interface Cache {
	channel: string | null;
	userId: string | null;
	guild: string | null;
	user: string | null;
}

export default class TraceValueManager {
	private _cache: Cache = this._emptyCache();

	public get() {
		return this._cache;
	}

	public set(newCache: Cache) {
		this._cache = newCache;
	}

	public has(key: "USER" | "GUILD" | "CHANNEL") {
		if (key === "CHANNEL") return !!this._cache.channel;
		if (key === "GUILD") return !!this._cache.guild;
		if (key === "USER") return !!this._cache.userId;
		return false;
	}

	public any() {
		return !!this._cache.channel || !!this._cache.guild || !!this._cache.userId;
	}

	public setChannel(channel: TextBasedChannels | null) {
		if (!channel || channel.type !== "DM") {
			this._cache.channel = channel?.name ?? null;
		}
	}

	public setGuild(guild: Guild | null) {
		this._cache.guild = guild?.name ?? null;
	}

	public setUser(user: User | null) {
		this._cache.userId = user?.id ?? null;
		this._cache.user = user?.tag ?? null;
	}

	public clear() {
		this._cache = this._emptyCache();
	}

	private _emptyCache() {
		return {
			channel: null,
			userId: null,
			guild: null,
			user: null
		} as Cache;
	}
}
