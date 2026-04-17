Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/utilities.ts
function titleCase(value) {
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
//#endregion
//#region src/operators/parse/parse.ts
const IRREGULAR_GRANDFATHERED = {
	"en-gb-oed": "en-GB-oed",
	"i-ami": "i-ami",
	"i-bnn": "i-bnn",
	"i-default": "i-default",
	"i-enochian": "i-enochian",
	"i-hak": "i-hak",
	"i-klingon": "i-klingon",
	"i-lux": "i-lux",
	"i-mingo": "i-mingo",
	"i-navajo": "i-navajo",
	"i-pwn": "i-pwn",
	"i-tao": "i-tao",
	"i-tay": "i-tay",
	"i-tsu": "i-tsu",
	"sgn-be-fr": "sgn-BE-FR",
	"sgn-be-nl": "sgn-BE-NL",
	"sgn-ch-de": "sgn-CH-DE"
};
const REGULAR_GRANDFATHERED = {
	"art-lojban": "art-lojban",
	"cel-gaulish": "cel-gaulish",
	"no-bok": "no-bok",
	"no-nyn": "no-nyn",
	"zh-guoyu": "zh-guoyu",
	"zh-hakka": "zh-hakka",
	"zh-min": "zh-min",
	"zh-min-nan": "zh-min-nan",
	"zh-xiang": "zh-xiang"
};
const LANGTAG_RE = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i;
function splitSubtags(raw) {
	const parts = raw.split("-");
	parts.shift();
	return parts.map((subtag) => subtag.toLowerCase());
}
function hasDuplicates(subtags) {
	const seen = /* @__PURE__ */ new Set();
	for (const subtag of subtags) {
		if (seen.has(subtag)) return true;
		seen.add(subtag);
	}
	return false;
}
function parseLanguageAndExtlang(raw) {
	const parts = raw.split("-");
	return {
		language: parts.shift().toLowerCase(),
		extlang: parts.map((subtag) => subtag.toLowerCase())
	};
}
function parseExtensions(raw) {
	const tokens = raw.split("-");
	tokens.shift();
	const result = [];
	const singletonsSeen = /* @__PURE__ */ new Set();
	let currentSingleton;
	let currentSubtags = [];
	for (const token of tokens) if (token.length === 1) {
		if (currentSingleton) result.push({
			singleton: currentSingleton.toLowerCase(),
			subtags: currentSubtags.map((subtag) => subtag.toLowerCase())
		});
		const lower = token.toLowerCase();
		if (singletonsSeen.has(lower)) return null;
		singletonsSeen.add(lower);
		currentSingleton = token;
		currentSubtags = [];
	} else currentSubtags.push(token);
	result.push({
		singleton: currentSingleton.toLowerCase(),
		subtags: currentSubtags.map((subtag) => subtag.toLowerCase())
	});
	return result;
}
/** Parse a BCP 47 language tag string into a structured object. Returns `null` for invalid input. */
function parse(tag) {
	const match = LANGTAG_RE.exec(tag);
	if (!match) return null;
	match.shift();
	const [irregular, regular, languageGroup, script, region, variantGroup, extensionGroup, langPrivateuseGroup, standalonePrivateuseGroup] = match;
	if (irregular) return {
		type: "grandfathered",
		grandfathered: {
			type: "irregular",
			tag: IRREGULAR_GRANDFATHERED[irregular.toLowerCase()]
		}
	};
	if (regular) return {
		type: "grandfathered",
		grandfathered: {
			type: "regular",
			tag: REGULAR_GRANDFATHERED[regular.toLowerCase()]
		}
	};
	if (standalonePrivateuseGroup) {
		const parts = standalonePrivateuseGroup.split("-");
		parts.shift();
		return {
			type: "privateuse",
			privateuse: parts.map((subtag) => subtag.toLowerCase())
		};
	}
	const { language, extlang } = parseLanguageAndExtlang(languageGroup);
	const variant = variantGroup ? splitSubtags(variantGroup) : [];
	if (hasDuplicates(variant)) return null;
	const extension = extensionGroup ? parseExtensions(extensionGroup) : [];
	if (!extension) return null;
	return {
		type: "langtag",
		langtag: {
			language,
			extlang,
			script: script ? titleCase(script) : null,
			region: region ? region.toUpperCase() : null,
			variant,
			extension,
			privateuse: langPrivateuseGroup ? splitSubtags(langPrivateuseGroup).slice(1) : []
		}
	};
}
//#endregion
//#region src/operators/stringify/stringify.ts
/** Convert a parsed `BCP47Tag` object back into a well-formed language tag string. */
function stringify(tag) {
	switch (tag.type) {
		case "grandfathered": return tag.grandfathered.tag;
		case "privateuse": return "x-" + tag.privateuse.map((subtag) => subtag.toLowerCase()).join("-");
		case "langtag": {
			const parts = [];
			parts.push(tag.langtag.language.toLowerCase());
			for (const subtag of tag.langtag.extlang) parts.push(subtag.toLowerCase());
			if (tag.langtag.script) parts.push(titleCase(tag.langtag.script));
			if (tag.langtag.region) parts.push(tag.langtag.region.toUpperCase());
			for (const subtag of tag.langtag.variant) parts.push(subtag.toLowerCase());
			for (const extension of tag.langtag.extension) {
				parts.push(extension.singleton.toLowerCase());
				for (const subtag of extension.subtags) parts.push(subtag.toLowerCase());
			}
			if (tag.langtag.privateuse.length > 0) {
				parts.push("x");
				for (const subtag of tag.langtag.privateuse) parts.push(subtag.toLowerCase());
			}
			return parts.join("-");
		}
	}
}
//#endregion
//#region src/operators/langtag/langtag.ts
const LANGUAGE_RE = /^[a-z]{2,8}$/i;
const EXTLANG_RE = /^[a-z]{3}$/i;
const SCRIPT_RE = /^[a-z]{4}$/i;
const REGION_RE = /^(?:[a-z]{2}|\d{3})$/i;
const VARIANT_RE = /^(?:[\da-z]{5,8}|\d[\da-z]{3})$/i;
const SINGLETON_RE = /^[\da-wy-z]$/i;
const EXTENSION_SUBTAG_RE = /^[\da-z]{2,8}$/i;
const PRIVATEUSE_RE = /^[\da-z]{1,8}$/i;
function validate(condition, message) {
	if (!condition) throw new RangeError(message);
}
/** Build a `BCP47Tag` from parts with sensible defaults. Throws `RangeError` on invalid input. */
function langtag(language, options) {
	validate(LANGUAGE_RE.test(language), `Invalid language: '${language}'`);
	const extlang = options?.extlang ?? [];
	if (extlang.length > 0) validate(language.length <= 3, `Extlang is only valid with 2-3 character language subtags, got '${language}'`);
	for (const subtag of extlang) validate(EXTLANG_RE.test(subtag), `Invalid extlang: '${subtag}'`);
	validate(extlang.length <= 3, `Too many extlang subtags: ${extlang.length} (max 3)`);
	if (options?.script !== void 0) validate(SCRIPT_RE.test(options.script), `Invalid script: '${options.script}'`);
	if (options?.region !== void 0) validate(REGION_RE.test(options.region), `Invalid region: '${options.region}'`);
	const variant = options?.variant ?? [];
	const variantsSeen = /* @__PURE__ */ new Set();
	for (const subtag of variant) {
		validate(VARIANT_RE.test(subtag), `Invalid variant: '${subtag}'`);
		const lower = subtag.toLowerCase();
		validate(!variantsSeen.has(lower), `Duplicate variant: '${subtag}'`);
		variantsSeen.add(lower);
	}
	const extension = options?.extension ?? [];
	const singletons = /* @__PURE__ */ new Set();
	for (const entry of extension) {
		validate(SINGLETON_RE.test(entry.singleton), `Invalid extension singleton: '${entry.singleton}'`);
		const lower = entry.singleton.toLowerCase();
		validate(!singletons.has(lower), `Duplicate extension singleton: '${entry.singleton}'`);
		singletons.add(lower);
		validate(entry.subtags.length > 0, `Extension '${entry.singleton}' must have at least one subtag`);
		for (const subtag of entry.subtags) validate(EXTENSION_SUBTAG_RE.test(subtag), `Invalid extension subtag: '${subtag}'`);
	}
	const privateuse = options?.privateuse ?? [];
	for (const subtag of privateuse) validate(PRIVATEUSE_RE.test(subtag), `Invalid privateuse subtag: '${subtag}'`);
	return {
		type: "langtag",
		langtag: {
			language: language.toLowerCase(),
			extlang: extlang.map((subtag) => subtag.toLowerCase()),
			script: options?.script ? titleCase(options.script) : null,
			region: options?.region ? options.region.toUpperCase() : null,
			variant: variant.map((subtag) => subtag.toLowerCase()),
			extension: extension.map((entry) => ({
				singleton: entry.singleton.toLowerCase(),
				subtags: entry.subtags.map((subtag) => subtag.toLowerCase())
			})),
			privateuse: privateuse.map((subtag) => subtag.toLowerCase())
		}
	};
}
//#endregion
//#region src/language-subtag-registry.ts
const DEPRECATED_LANGUAGES = {
	aam: "aas",
	adp: "dz",
	ajp: "apc",
	ajt: "aeb",
	asd: "snz",
	aue: "ktz",
	ayx: "nun",
	bgm: "bcg",
	bic: "bir",
	bjd: "drl",
	blg: "iba",
	ccq: "rki",
	cjr: "mom",
	cka: "cmr",
	cmk: "xch",
	coy: "pij",
	cqu: "quh",
	dek: "sqm",
	dit: "dif",
	drh: "khk",
	drr: "kzk",
	drw: "prs",
	gav: "dev",
	gfx: "vaj",
	ggn: "gvr",
	gli: "kzk",
	gti: "nyc",
	guv: "duz",
	hrr: "jal",
	ibi: "opa",
	ilw: "gal",
	in: "id",
	iw: "he",
	jeg: "oyb",
	ji: "yi",
	jw: "jv",
	kgc: "tdf",
	kgh: "kml",
	kgm: "plu",
	koj: "kwv",
	krm: "bmf",
	ktr: "dtp",
	kvs: "gdj",
	kwq: "yam",
	kxe: "tvd",
	kxl: "kru",
	kzj: "dtp",
	kzt: "dtp",
	lak: "ksp",
	lii: "raq",
	llo: "ngt",
	lmm: "rmx",
	meg: "cir",
	mo: "ro",
	mst: "mry",
	mwj: "vaj",
	myd: "aog",
	myt: "mry",
	nad: "xny",
	ncp: "kdz",
	nns: "nbr",
	nnx: "ngv",
	nom: "cbr",
	nte: "eko",
	nts: "pij",
	nxu: "bpp",
	oun: "vaj",
	pat: "kxr",
	pcr: "adx",
	pmc: "huw",
	pmk: "crr",
	pmu: "phr",
	ppa: "bfy",
	ppr: "lcq",
	prp: "gu",
	pry: "prt",
	puz: "pub",
	sca: "hle",
	skk: "oyb",
	smd: "kmb",
	snb: "iba",
	szd: "umi",
	tdu: "dtp",
	thc: "tpo",
	thw: "ola",
	thx: "oyb",
	tie: "ras",
	tkk: "twm",
	tlw: "weo",
	tmk: "tdg",
	tmp: "tyj",
	tne: "kak",
	tnf: "prs",
	tpw: "tpn",
	tsf: "taj",
	uok: "ema",
	xba: "cax",
	xia: "acn",
	xkh: "waw",
	xrq: "dmw",
	xss: "zko",
	ybd: "rki",
	yma: "lrr",
	ymt: "mtm",
	yos: "zom",
	yuu: "yug",
	zir: "scv",
	zkb: "kjh"
};
const EXTLANG_PREFIXES = {
	aao: "ar",
	abh: "ar",
	abv: "ar",
	acm: "ar",
	acq: "ar",
	acw: "ar",
	acx: "ar",
	acy: "ar",
	adf: "ar",
	ads: "sgn",
	aeb: "ar",
	aec: "ar",
	aed: "sgn",
	aen: "sgn",
	afb: "ar",
	afg: "sgn",
	ajs: "sgn",
	apc: "ar",
	apd: "ar",
	arb: "ar",
	arq: "ar",
	ars: "ar",
	ary: "ar",
	arz: "ar",
	ase: "sgn",
	asf: "sgn",
	asp: "sgn",
	asq: "sgn",
	asw: "sgn",
	auz: "ar",
	avl: "ar",
	ayh: "ar",
	ayl: "ar",
	ayn: "ar",
	ayp: "ar",
	bfi: "sgn",
	bfk: "sgn",
	bjn: "ms",
	bog: "sgn",
	bqn: "sgn",
	bqy: "sgn",
	btj: "ms",
	bve: "ms",
	bvl: "sgn",
	bvu: "ms",
	bzs: "sgn",
	cdo: "zh",
	cds: "sgn",
	cjy: "zh",
	cmn: "zh",
	cnp: "zh",
	coa: "ms",
	cpx: "zh",
	csc: "sgn",
	csd: "sgn",
	cse: "sgn",
	csf: "sgn",
	csg: "sgn",
	csl: "sgn",
	csn: "sgn",
	csp: "zh",
	csq: "sgn",
	csr: "sgn",
	csx: "sgn",
	czh: "zh",
	czo: "zh",
	doq: "sgn",
	dse: "sgn",
	dsl: "sgn",
	dsz: "sgn",
	dup: "ms",
	ecs: "sgn",
	ehs: "sgn",
	esl: "sgn",
	esn: "sgn",
	eso: "sgn",
	eth: "sgn",
	fcs: "sgn",
	fse: "sgn",
	fsl: "sgn",
	fss: "sgn",
	gan: "zh",
	gds: "sgn",
	gom: "kok",
	gse: "sgn",
	gsg: "sgn",
	gsm: "sgn",
	gss: "sgn",
	gus: "sgn",
	hab: "sgn",
	haf: "sgn",
	hak: "zh",
	hds: "sgn",
	hji: "ms",
	hks: "sgn",
	hnm: "zh",
	hos: "sgn",
	hps: "sgn",
	hsh: "sgn",
	hsl: "sgn",
	hsn: "zh",
	icl: "sgn",
	iks: "sgn",
	ils: "sgn",
	inl: "sgn",
	ins: "sgn",
	ise: "sgn",
	isg: "sgn",
	isr: "sgn",
	jak: "ms",
	jax: "ms",
	jcs: "sgn",
	jhs: "sgn",
	jks: "sgn",
	jls: "sgn",
	jos: "sgn",
	jsl: "sgn",
	jus: "sgn",
	kgi: "sgn",
	knn: "kok",
	kvb: "ms",
	kvk: "sgn",
	kvr: "ms",
	kxd: "ms",
	lbs: "sgn",
	lce: "ms",
	lcf: "ms",
	lgs: "sgn",
	liw: "ms",
	lls: "sgn",
	lsb: "sgn",
	lsc: "sgn",
	lsl: "sgn",
	lsn: "sgn",
	lso: "sgn",
	lsp: "sgn",
	lst: "sgn",
	lsv: "sgn",
	lsw: "sgn",
	lsy: "sgn",
	ltg: "lv",
	luh: "zh",
	lvs: "lv",
	lws: "sgn",
	lzh: "zh",
	max: "ms",
	mdl: "sgn",
	meo: "ms",
	mfa: "ms",
	mfb: "ms",
	mfs: "sgn",
	min: "ms",
	mnp: "zh",
	mqg: "ms",
	mre: "sgn",
	msd: "sgn",
	msi: "ms",
	msr: "sgn",
	mui: "ms",
	mzc: "sgn",
	mzg: "sgn",
	mzy: "sgn",
	nan: "zh",
	nbs: "sgn",
	ncs: "sgn",
	nsi: "sgn",
	nsl: "sgn",
	nsp: "sgn",
	nsr: "sgn",
	nzs: "sgn",
	okl: "sgn",
	orn: "ms",
	ors: "ms",
	pel: "ms",
	pga: "ar",
	pgz: "sgn",
	pks: "sgn",
	prl: "sgn",
	prz: "sgn",
	psc: "sgn",
	psd: "sgn",
	pse: "ms",
	psg: "sgn",
	psl: "sgn",
	pso: "sgn",
	psp: "sgn",
	psr: "sgn",
	pys: "sgn",
	rib: "sgn",
	rms: "sgn",
	rnb: "sgn",
	rsl: "sgn",
	rsm: "sgn",
	rsn: "sgn",
	sdl: "sgn",
	sfb: "sgn",
	sfs: "sgn",
	sgg: "sgn",
	sgx: "sgn",
	shu: "ar",
	sjc: "zh",
	slf: "sgn",
	sls: "sgn",
	sqk: "sgn",
	sqs: "sgn",
	sqx: "sgn",
	ssh: "ar",
	ssp: "sgn",
	ssr: "sgn",
	svk: "sgn",
	swc: "sw",
	swh: "sw",
	swl: "sgn",
	syy: "sgn",
	szs: "sgn",
	tmw: "ms",
	tse: "sgn",
	tsm: "sgn",
	tsq: "sgn",
	tss: "sgn",
	tsy: "sgn",
	tza: "sgn",
	ugn: "sgn",
	ugy: "sgn",
	ukl: "sgn",
	uks: "sgn",
	urk: "ms",
	uzn: "uz",
	uzs: "uz",
	vgt: "sgn",
	vkk: "ms",
	vkt: "ms",
	vsi: "sgn",
	vsl: "sgn",
	vsv: "sgn",
	wbs: "sgn",
	wuu: "zh",
	xki: "sgn",
	xml: "sgn",
	xmm: "ms",
	xms: "sgn",
	ygs: "sgn",
	yhs: "sgn",
	ysl: "sgn",
	ysm: "sgn",
	yue: "zh",
	zib: "sgn",
	zlm: "ms",
	zmi: "ms",
	zsl: "sgn",
	zsm: "ms"
};
const SUPPRESS_SCRIPTS = {
	ab: "Cyrl",
	af: "Latn",
	am: "Ethi",
	ar: "Arab",
	as: "Beng",
	ay: "Latn",
	be: "Cyrl",
	bg: "Cyrl",
	bn: "Beng",
	bs: "Latn",
	ca: "Latn",
	ch: "Latn",
	cs: "Latn",
	cy: "Latn",
	da: "Latn",
	de: "Latn",
	dsb: "Latn",
	dv: "Thaa",
	dz: "Tibt",
	el: "Grek",
	en: "Latn",
	eo: "Latn",
	es: "Latn",
	et: "Latn",
	eu: "Latn",
	fa: "Arab",
	fi: "Latn",
	fj: "Latn",
	fo: "Latn",
	fr: "Latn",
	frr: "Latn",
	frs: "Latn",
	fy: "Latn",
	ga: "Latn",
	gl: "Latn",
	gn: "Latn",
	gsw: "Latn",
	gu: "Gujr",
	gv: "Latn",
	he: "Hebr",
	hi: "Deva",
	hr: "Latn",
	hsb: "Latn",
	ht: "Latn",
	hu: "Latn",
	hy: "Armn",
	id: "Latn",
	is: "Latn",
	it: "Latn",
	ja: "Jpan",
	ka: "Geor",
	kk: "Cyrl",
	kl: "Latn",
	km: "Khmr",
	kn: "Knda",
	ko: "Kore",
	kok: "Deva",
	la: "Latn",
	lb: "Latn",
	ln: "Latn",
	lo: "Laoo",
	lt: "Latn",
	lv: "Latn",
	mai: "Deva",
	men: "Latn",
	mg: "Latn",
	mh: "Latn",
	mk: "Cyrl",
	ml: "Mlym",
	mr: "Deva",
	ms: "Latn",
	mt: "Latn",
	my: "Mymr",
	na: "Latn",
	nb: "Latn",
	nd: "Latn",
	nds: "Latn",
	ne: "Deva",
	niu: "Latn",
	nl: "Latn",
	nn: "Latn",
	no: "Latn",
	nqo: "Nkoo",
	nr: "Latn",
	nso: "Latn",
	ny: "Latn",
	om: "Latn",
	or: "Orya",
	pa: "Guru",
	pl: "Latn",
	ps: "Arab",
	pt: "Latn",
	qu: "Latn",
	rm: "Latn",
	rn: "Latn",
	ro: "Latn",
	ru: "Cyrl",
	rw: "Latn",
	sg: "Latn",
	si: "Sinh",
	sk: "Latn",
	sl: "Latn",
	sm: "Latn",
	so: "Latn",
	sq: "Latn",
	ss: "Latn",
	st: "Latn",
	sv: "Latn",
	sw: "Latn",
	ta: "Taml",
	te: "Telu",
	tem: "Latn",
	th: "Thai",
	ti: "Ethi",
	tkl: "Latn",
	tl: "Latn",
	tmh: "Latn",
	tn: "Latn",
	to: "Latn",
	tpi: "Latn",
	tr: "Latn",
	ts: "Latn",
	tvl: "Latn",
	uk: "Cyrl",
	ur: "Arab",
	ve: "Latn",
	vi: "Latn",
	xh: "Latn",
	yi: "Hebr",
	zbl: "Blis",
	zu: "Latn"
};
const DEPRECATED_REGIONS = {
	BU: "MM",
	DD: "DE",
	FX: "FR",
	TP: "TL",
	YD: "YE",
	ZR: "CD"
};
const DEPRECATED_VARIANTS = { heploc: "alalc97" };
const REDUNDANT_PREFERRED = {
	"sgn-BR": "bzs",
	"sgn-CO": "csn",
	"sgn-DE": "gsg",
	"sgn-DK": "dsl",
	"sgn-ES": "ssp",
	"sgn-FR": "fsl",
	"sgn-GB": "bfi",
	"sgn-GR": "gss",
	"sgn-IE": "isg",
	"sgn-IT": "ise",
	"sgn-JP": "jsl",
	"sgn-MX": "mfs",
	"sgn-NI": "ncs",
	"sgn-NL": "dse",
	"sgn-NO": "nsl",
	"sgn-PT": "psr",
	"sgn-SE": "swl",
	"sgn-US": "ase",
	"sgn-ZA": "sfs"
};
const GRANDFATHERED_PREFERRED = {
	"art-lojban": "jbo",
	"en-gb-oed": "en-GB-oxendict",
	"i-ami": "ami",
	"i-bnn": "bnn",
	"i-hak": "hak",
	"i-klingon": "tlh",
	"i-lux": "lb",
	"i-navajo": "nv",
	"i-pwn": "pwn",
	"i-tao": "tao",
	"i-tay": "tay",
	"i-tsu": "tsu",
	"no-bok": "nb",
	"no-nyn": "nn",
	"sgn-be-fr": "sfb",
	"sgn-be-nl": "vgt",
	"sgn-ch-de": "sgg",
	"zh-guoyu": "cmn",
	"zh-hakka": "hak",
	"zh-min-nan": "nan",
	"zh-xiang": "hsn"
};
//#endregion
//#region src/operators/canonicalize/canonicalize.ts
function canonicalizeTag(tag) {
	if (tag.type !== "langtag") return tag;
	let language = tag.langtag.language;
	let extlang = tag.langtag.extlang;
	let script = tag.langtag.script;
	let region = tag.langtag.region;
	const preferred = DEPRECATED_LANGUAGES[language];
	if (preferred) language = preferred;
	if (extlang.length > 0) {
		const prefix = EXTLANG_PREFIXES[extlang[0]];
		if (prefix && prefix === language) {
			language = extlang[0];
			extlang = extlang.slice(1);
		}
	}
	if (script) {
		const suppressed = SUPPRESS_SCRIPTS[language];
		if (suppressed && suppressed === script) script = null;
	}
	if (region) {
		const preferredRegion = DEPRECATED_REGIONS[region];
		if (preferredRegion) region = preferredRegion;
	}
	if (region) {
		const redundant = REDUNDANT_PREFERRED[`${language}-${region}`];
		if (redundant) {
			language = redundant;
			extlang = [];
			region = null;
		}
	}
	const variant = tag.langtag.variant.map((subtag) => {
		return DEPRECATED_VARIANTS[subtag] ?? subtag;
	});
	const canonicalizedExtensions = tag.langtag.extension.map((extension) => {
		if (extension.singleton === "u") return canonicalizeUExtension(extension);
		if (extension.singleton === "t") return canonicalizeTExtension(extension);
		return extension;
	});
	const sorted = canonicalizedExtensions.length > 1 ? [...canonicalizedExtensions].sort((left, right) => {
		if (left.singleton < right.singleton) return -1;
		if (left.singleton > right.singleton) return 1;
		return 0;
	}) : canonicalizedExtensions;
	return {
		type: "langtag",
		langtag: {
			...tag.langtag,
			language,
			extlang,
			script,
			region,
			variant,
			extension: sorted
		}
	};
}
const UKEY_RE$1 = /^[a-z\d][a-z]$/;
const TKEY_RE$1 = /^[a-z]\d$/;
function canonicalizeUExtension(extension) {
	const attributes = [];
	const keywords = [];
	let currentKey = null;
	let currentValues = [];
	for (const subtag of extension.subtags) if (subtag.length === 2 && UKEY_RE$1.test(subtag)) {
		if (currentKey) keywords.push({
			key: currentKey,
			values: currentValues
		});
		currentKey = subtag;
		currentValues = [];
	} else if (currentKey) currentValues.push(subtag);
	else attributes.push(subtag);
	if (currentKey) keywords.push({
		key: currentKey,
		values: currentValues
	});
	keywords.sort((left, right) => {
		if (left.key < right.key) return -1;
		if (left.key > right.key) return 1;
		return 0;
	});
	attributes.sort();
	const subtags = [...attributes];
	for (const keyword of keywords) subtags.push(keyword.key, ...keyword.values);
	return {
		singleton: extension.singleton,
		subtags
	};
}
function canonicalizeTExtension(extension) {
	const sourceParts = [];
	const fields = [];
	let currentKey = null;
	let currentValues = [];
	let inSource = true;
	for (const subtag of extension.subtags) if (TKEY_RE$1.test(subtag)) {
		inSource = false;
		if (currentKey) fields.push({
			key: currentKey,
			values: currentValues
		});
		currentKey = subtag;
		currentValues = [];
	} else if (inSource) sourceParts.push(subtag);
	else currentValues.push(subtag);
	if (currentKey) fields.push({
		key: currentKey,
		values: currentValues
	});
	fields.sort((left, right) => {
		if (left.key < right.key) return -1;
		if (left.key > right.key) return 1;
		return 0;
	});
	const subtags = [...sourceParts];
	for (const field of fields) subtags.push(field.key, ...field.values);
	return {
		singleton: extension.singleton,
		subtags
	};
}
/** Canonicalize a BCP 47 tag per RFC 5646 §4.5 (case, deprecated subtags, suppress-script, extlang). Returns `null` for invalid input. */
function canonicalize(tag) {
	const parsed = parse(tag);
	if (!parsed) return null;
	if (parsed.type === "grandfathered") {
		const preferred = GRANDFATHERED_PREFERRED[parsed.grandfathered.tag.toLowerCase()];
		if (preferred) return canonicalize(preferred);
		return stringify(parsed);
	}
	return stringify(canonicalizeTag(parsed));
}
//#endregion
//#region src/operators/filter/filter.ts
function matchSubtags(rangeSubtags, tagSubtags) {
	let rangeIndex = 0;
	let tagIndex = 0;
	if (rangeSubtags[0] !== "*" && rangeSubtags[0].toLowerCase() !== tagSubtags[0].toLowerCase()) return false;
	rangeIndex++;
	tagIndex++;
	while (rangeIndex < rangeSubtags.length) {
		const rangeSubtag = rangeSubtags[rangeIndex];
		if (rangeSubtag === "*") {
			rangeIndex++;
			continue;
		}
		if (tagIndex >= tagSubtags.length) return false;
		const tagSubtag = tagSubtags[tagIndex];
		if (rangeSubtag.toLowerCase() === tagSubtag.toLowerCase()) {
			rangeIndex++;
			tagIndex++;
			continue;
		}
		if (tagSubtag.length === 1) return false;
		tagIndex++;
	}
	return true;
}
/** Find all matching tags via Extended Filtering per RFC 4647 §3.3.2. Supports `*` wildcards. */
function filter(tags, patterns) {
	const rangeList = typeof patterns === "string" ? [patterns] : patterns;
	const results = [];
	const seen = /* @__PURE__ */ new Set();
	for (const range of rangeList) {
		if (range === "*") {
			for (const tag of tags) {
				const lower = tag.toLowerCase();
				if (!seen.has(lower)) {
					seen.add(lower);
					results.push(tag);
				}
			}
			continue;
		}
		const rangeSubtags = range.split("-");
		for (const tag of tags) {
			const tagLower = tag.toLowerCase();
			if (seen.has(tagLower)) continue;
			if (matchSubtags(rangeSubtags, tag.split("-"))) {
				seen.add(tagLower);
				results.push(tag);
			}
		}
	}
	return results;
}
//#endregion
//#region src/operators/lookup/lookup.ts
function truncate(subtags) {
	subtags.pop();
	while (subtags.length > 0 && subtags[subtags.length - 1].length === 1) subtags.pop();
	return subtags;
}
/** Find the single best matching tag via Lookup per RFC 4647 §3.4. Returns first match, `defaultValue`, or `null`. */
function lookup(tags, preferences, defaultValue) {
	const rangeList = typeof preferences === "string" ? [preferences] : preferences;
	const tagMap = /* @__PURE__ */ new Map();
	for (const tag of tags) {
		const lower = tag.toLowerCase();
		if (!tagMap.has(lower)) tagMap.set(lower, tag);
	}
	for (const range of rangeList) {
		if (range === "*") continue;
		let subtags = range.split("-");
		while (subtags.length > 0) {
			const candidate = subtags.join("-").toLowerCase();
			const matched = tagMap.get(candidate);
			if (matched) return matched;
			subtags = truncate(subtags);
		}
	}
	return defaultValue ?? null;
}
//#endregion
//#region src/operators/extension/extension.ts
const TKEY_RE = /^[a-z]\d$/i;
const UKEY_RE = /^[a-z\d][a-z]$/i;
function isUnicodeKey(subtag) {
	return subtag.length === 2 && UKEY_RE.test(subtag);
}
/** Extract Unicode locale attributes and keywords from the `u` extension (RFC 6067). Returns `null` if absent. */
function extensionU(tag) {
	if (tag.type !== "langtag") return null;
	const uExtension = tag.langtag.extension.find((entry) => entry.singleton === "u");
	if (!uExtension) return null;
	const attributes = [];
	const attributesSeen = /* @__PURE__ */ new Set();
	const keywords = {};
	let currentKey = null;
	let currentValues = [];
	for (const subtag of uExtension.subtags) if (isUnicodeKey(subtag)) {
		if (currentKey && !(currentKey in keywords)) keywords[currentKey] = currentValues.join("-");
		currentKey = subtag;
		currentValues = [];
	} else if (currentKey) currentValues.push(subtag);
	else if (!attributesSeen.has(subtag)) {
		attributesSeen.add(subtag);
		attributes.push(subtag);
	}
	if (currentKey && !(currentKey in keywords)) keywords[currentKey] = currentValues.join("-");
	return {
		attributes,
		keywords
	};
}
/** Extract transformed content data from the `t` extension (RFC 6497). Returns `null` if absent. */
function extensionT(tag) {
	if (tag.type !== "langtag") return null;
	const tExtension = tag.langtag.extension.find((entry) => entry.singleton === "t");
	if (!tExtension) return null;
	const sourceParts = [];
	const fields = {};
	let currentKey = null;
	let currentValues = [];
	let inSource = true;
	for (const subtag of tExtension.subtags) if (TKEY_RE.test(subtag)) {
		inSource = false;
		if (currentKey && !(currentKey in fields)) fields[currentKey] = currentValues.join("-");
		currentKey = subtag;
		currentValues = [];
	} else if (inSource) sourceParts.push(subtag);
	else currentValues.push(subtag);
	if (currentKey && !(currentKey in fields)) fields[currentKey] = currentValues.join("-");
	return {
		source: sourceParts.length > 0 ? sourceParts.join("-") : null,
		fields
	};
}
//#endregion
//#region src/operators/extension/cldr-keys.ts
const UNICODE_LOCALE_KEYS = {
	ca: "Calendar",
	cf: "Currency format",
	co: "Collation",
	cu: "Currency",
	dx: "Dictionary break exclusions",
	em: "Emoji presentation",
	fw: "First day of week",
	hc: "Hour cycle",
	ka: "Collation alternate handling",
	kb: "Collation backward sorting",
	kc: "Collation case level",
	kf: "Collation case first",
	kk: "Collation normalization",
	kn: "Collation numeric ordering",
	kr: "Collation reorder",
	ks: "Collation strength",
	kv: "Collation max variable",
	lb: "Line break",
	lw: "Word break",
	ms: "Measurement system",
	mu: "Measurement unit",
	nu: "Numbering system",
	rg: "Region override",
	sd: "Subdivision",
	ss: "Sentence break suppressions",
	tz: "Timezone",
	va: "Common variant"
};
const TRANSFORM_KEYS = {
	d0: "Transform destination",
	h0: "Hybrid locale",
	i0: "Input method",
	k0: "Keyboard",
	m0: "Transform mechanism",
	s0: "Transform source",
	t0: "Machine translation",
	x0: "Private use transform"
};
//#endregion
//#region src/operators/accept-language/accept-language.ts
const QUALITY_RE = /;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)(?:\s*$|\s*,|\s*;)/i;
const HAS_QUALITY_PARAM_RE = /;\s*q=/i;
const SEMICOLON_PARAMS_RE = /;.*/;
const LANGUAGE_RANGE_RE = /^(?:\*|[a-z]{1,8}(?:-[a-z\d]{1,8})*)$/i;
/** Parse an `Accept-Language` header into entries sorted by quality descending (RFC 9110 §12.5.4). */
function acceptLanguage(header) {
	if (!header.trim()) return [];
	const entries = [];
	for (const segment of header.split(",")) {
		const trimmed = segment.trim();
		if (!trimmed) continue;
		const tag = trimmed.replace(SEMICOLON_PARAMS_RE, "").trim();
		if (!tag || !LANGUAGE_RANGE_RE.test(tag)) continue;
		const qualityMatch = QUALITY_RE.exec(trimmed);
		if (!qualityMatch && HAS_QUALITY_PARAM_RE.test(trimmed)) continue;
		const quality = qualityMatch ? parseFloat(qualityMatch[1]) : 1;
		entries.push({
			tag,
			quality
		});
	}
	entries.sort((left, right) => right.quality - left.quality);
	return entries;
}
//#endregion
exports.TRANSFORM_KEYS = TRANSFORM_KEYS;
exports.UNICODE_LOCALE_KEYS = UNICODE_LOCALE_KEYS;
exports.acceptLanguage = acceptLanguage;
exports.canonicalize = canonicalize;
exports.extensionT = extensionT;
exports.extensionU = extensionU;
exports.filter = filter;
exports.langtag = langtag;
exports.lookup = lookup;
exports.parse = parse;
exports.stringify = stringify;

//# sourceMappingURL=index.cjs.map