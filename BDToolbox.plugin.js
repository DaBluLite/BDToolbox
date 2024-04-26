/**
 * @name BDToolbox
 * @author DaBluLite
 * @description A button next to the inbox button that opens a list of tools (Heavily inspired from VencordToolbox, full credits to Vendicated and Autumnvn for the original plugin).
 * @version 1.0.0
 * @authorId 582170007505731594
 * @invite ZfPH6SDkMW
 */

/*@cc_on
@if (@_jscript)

	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

'use strict';

const betterdiscord = new BdApi("BDToolbox");
const React = BdApi.React;
const ReactDOM = BdApi.ReactDOM;

// /home/dablulite/BD-Plugins/common.tsx
const Filters = {
	...betterdiscord.Webpack.Filters,
	byName: (name) => {
		return (target) => (target?.displayName ?? target?.constructor?.displayName) === name;
	},
	byKeys: (...keys) => {
		return (target) => target instanceof Object && keys.every((key) => key in target);
	},
	byProtos: (...protos) => {
		return (target) => target instanceof Object && target.prototype instanceof Object && protos.every((proto) => proto in target.prototype);
	},
	bySource: (...fragments) => {
		return (target) => {
			while (target instanceof Object && "$$typeof" in target) {
				target = target.render ?? target.type;
			}
			if (target instanceof Function) {
				const source = target.toString();
				const renderSource = target.prototype?.render?.toString();
				return fragments.every((fragment) => typeof fragment === "string" ? source.includes(fragment) || renderSource?.includes(fragment) : fragment(source) || renderSource && fragment(renderSource));
			} else {
				return false;
			}
		};
	}
};
const hasThrown = new WeakSet();
const wrapFilter = (filter) => (exports, module, moduleId) => {
	try {
		if (exports?.default?.remove && exports?.default?.set && exports?.default?.clear && exports?.default?.get && !exports?.default?.sort)
			return false;
		if (exports.remove && exports.set && exports.clear && exports.get && !exports.sort)
			return false;
		if (exports?.default?.getToken || exports?.default?.getEmail || exports?.default?.showToken)
			return false;
		if (exports.getToken || exports.getEmail || exports.showToken)
			return false;
		return filter(exports, module, moduleId);
	} catch (err) {
		if (!hasThrown.has(filter))
			console.warn("WebpackModules~getModule", "Module filter threw an exception.", filter, err);
		hasThrown.add(filter);
		return false;
	}
};
const listeners = new Set();
function addListener(listener) {
	listeners.add(listener);
	return removeListener.bind(null, listener);
}
function removeListener(listener) {
	return listeners.delete(listener);
}
const Webpack = {
	...betterdiscord.Webpack,
	getLazy: (filter, options = {}) => {
		const { signal: abortSignal, defaultExport = true, searchExports = false } = options;
		const fromCache = Webpack.getModule(filter, { defaultExport, searchExports });
		if (fromCache)
			return Promise.resolve(fromCache);
		const wrappedFilter = wrapFilter(filter);
		return new Promise((resolve) => {
			const cancel = () => removeListener(listener);
			const listener = function(exports) {
				if (!exports || exports === window || exports === document.documentElement || exports[Symbol.toStringTag] === "DOMTokenList")
					return;
				let foundModule = null;
				if (typeof exports === "object" && searchExports && !exports.TypedArray) {
					for (const key in exports) {
						foundModule = null;
						const wrappedExport = exports[key];
						if (!wrappedExport)
							continue;
						if (wrappedFilter(wrappedExport))
							foundModule = wrappedExport;
					}
				} else {
					if (exports.Z && wrappedFilter(exports.Z))
						foundModule = defaultExport ? exports.Z : exports;
					if (exports.ZP && wrappedFilter(exports.ZP))
						foundModule = defaultExport ? exports.ZP : exports;
					if (exports.__esModule && exports.default && wrappedFilter(exports.default))
						foundModule = defaultExport ? exports.default : exports;
					if (wrappedFilter(exports))
						foundModule = exports;
				}
				if (!foundModule)
					return;
				cancel();
				resolve(foundModule);
			};
			addListener(listener);
			abortSignal?.addEventListener("abort", () => {
				cancel();
				resolve(null);
			});
		});
	}
};
ReactDOM?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.Events ?? [];
function makeLazy(factory, attempts = 5) {
	let tries = 0;
	let cache;
	return () => {
		if (!cache && attempts > tries++) {
			cache = factory();
			if (!cache && attempts === tries)
				console.error("Lazy factory failed:", factory);
		}
		return cache;
	};
}
const NoopComponent = () => null;
function LazyComponent(factory, attempts = 5) {
	const get = makeLazy(factory, attempts);
	const LazyComponent2 = (props) => {
		const Component = get() ?? NoopComponent;
		return BdApi.React.createElement(Component, { ...props });
	};
	LazyComponent2.$$vencordInternal = get;
	return LazyComponent2;
}
function handleModuleNotFound(method, ...filter) {
	const err = new Error(`webpack.${method} found no module`);
	console.error(err, "Filter:", filter);
}
function findExportedComponentLazy(...props) {
	return LazyComponent(() => {
		const res = Webpack.getModule(Filters.byProps(...props));
		if (!res)
			handleModuleNotFound("findExportedComponent", ...props);
		return res[props[0]];
	});
}

// common.tsx
let Card;
let Button;
let Switch;
let Tooltip;
let TextInput;
let TextArea;
let Text;
let Select;
let SearchableSelect;
let Slider;
let ButtonLooks;
let Popout;
let Dialog;
let TabBar;
let Paginator;
let ScrollerThin;
let Clickable;
let Avatar;
let FocusLock;
let useToken;
betterdiscord.Webpack.getByKeys("open", "init");
const Menu = {
	Menu: betterdiscord.Webpack.getByKeys("Menu").Menu,
	MenuItem: betterdiscord.Webpack.getByKeys("Menu").MenuItem,
	MenuGroup: betterdiscord.Webpack.getByKeys("Menu").MenuGroup,
	MenuCheckboxItem: betterdiscord.Webpack.getByKeys("Menu").MenuCheckboxItem
};
betterdiscord.Webpack.waitForModule(Filters.byKeys("FormItem", "Button")).then((m) => {
	({ useToken, Card, Button, FormSwitch: Switch, Tooltip, TextInput, TextArea, Text, Select, SearchableSelect, Slider, ButtonLooks, TabBar, Popout, Dialog, Paginator, ScrollerThin, Clickable, Avatar, FocusLock } = m);
});
betterdiscord.Webpack.waitForModule(Filters.byStoreName("GuildStore")).then((e) => e);
betterdiscord.Webpack.waitForModule(Filters.byStoreName("SelectedGuildStore")).then((e) => e);
({
	openModal: betterdiscord.Webpack.getByKeys("openModal", "ModalHeader").openModal,
	ModalRoot: betterdiscord.Webpack.getByKeys("ModalRoot").ModalRoot,
	ModalHeader: betterdiscord.Webpack.getByKeys("ModalRoot").ModalHeader,
	ModalContent: betterdiscord.Webpack.getByKeys("ModalRoot").ModalContent,
	ModalFooter: betterdiscord.Webpack.getByKeys("ModalRoot").ModalFooter
});
({
	show: betterdiscord.Webpack.getByKeys("showToast")["showToast"],
	pop: betterdiscord.Webpack.getByKeys("popToast")["popToast"],
	useToastStore: betterdiscord.Webpack.getByKeys("useToastStore")["useToastStore"],
	create: betterdiscord.Webpack.getByKeys("createToast")["createToast"]
});
betterdiscord.Webpack.getModule((m) => m.dispatch && m.subscribe);
betterdiscord.Webpack.waitForModule(Filters.byKeys("SUPPORTS_COPY", "copy")).then((e) => e);

// index.tsx
const InboxButton = betterdiscord.Webpack.getByStrings("useInDesktopNotificationCenterExperiment", { defaultExport: false });
const { icon: IconClass } = betterdiscord.Webpack.getByKeys("iconWrapper", "icon", "clickable");
const HeaderBarIcon = findExportedComponentLazy("Icon", "Divider");
function BetterDiscordToolbox(onClose) {
	const pluginEntries = [];
	for (const plugin of Object.values(betterdiscord.Plugins.getAll())) {
		if (plugin.exports.prototype.getToolboxActions && betterdiscord.Plugins.isEnabled(plugin.name)) {
			pluginEntries.push(
				BdApi.React.createElement(
					Menu.MenuGroup,
					{
						label: plugin.name,
						key: `bd-toolbox-${plugin.name}`
					},
					Object.entries(plugin.exports.prototype.getToolboxActions()).map(([text, action]) => {
						const key = `bd-toolbox-${plugin.name}-${text}`;
						return BdApi.React.createElement(
							Menu.MenuItem,
							{
								id: key,
								key,
								label: text,
								action
							}
						);
					})
				)
			);
		}
	}
	return BdApi.React.createElement(
		Menu.Menu,
		{
			navId: "bd-toolbox",
			onClose
		},
		...pluginEntries
	);
}
function BetterDiscordToolboxButton() {
	const [show, setShow] = React.useState(false);
	return BdApi.React.createElement(
		Popout,
		{
			position: "bottom",
			align: "right",
			animation: Popout.Animation.NONE,
			shouldShow: show,
			onRequestClose: () => setShow(false),
			renderPopout: () => BetterDiscordToolbox(() => setShow(false))
		},
		(_, { isShown }) => BdApi.React.createElement(
			HeaderBarIcon,
			{
				className: "bd-toolbox-btn",
				onClick: () => setShow((v) => !v),
				tooltip: isShown ? null : "BetterDiscord Toolbox",
				icon: () => BdApi.React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", version: "1.1", x: "0px", y: "0px", viewBox: "0 0 2000 2000", className: IconClass, width: 24, height: 24 }, BdApi.React.createElement("g", null, BdApi.React.createElement("path", { fill: "currentColor", d: "M1402.2,631.7c-9.7-353.4-286.2-496-642.6-496H68.4v714.1l442,398V490.7h257c274.5,0,274.5,344.9,0,344.9H597.6v329.5h169.8c274.5,0,274.5,344.8,0,344.8h-699v354.9h691.2c356.3,0,632.8-142.6,642.6-496c0-162.6-44.5-284.1-122.9-368.6C1357.7,915.8,1402.2,794.3,1402.2,631.7z" }), BdApi.React.createElement("path", { fill: "currentColor", d: "M1262.5,135.2L1262.5,135.2l-76.8,0c26.6,13.3,51.7,28.1,75,44.3c70.7,49.1,126.1,111.5,164.6,185.3c39.9,76.6,61.5,165.6,64.3,264.6l0,1.2v1.2c0,141.1,0,596.1,0,737.1v1.2l0,1.2c-2.7,99-24.3,188-64.3,264.6c-38.5,73.8-93.8,136.2-164.6,185.3c-22.6,15.7-46.9,30.1-72.6,43.1h72.5c346.2,1.9,671-171.2,671-567.9V716.7C1933.5,312.2,1608.7,135.2,1262.5,135.2z" }))),
				selected: isShown
			}
		)
	);
}
class BDToolbox {
	start() {
		betterdiscord.Patcher.after(
			InboxButton,
			"default",
			(cancel, result, returnValue) => {
				return [returnValue, BdApi.React.createElement(BetterDiscordToolboxButton, null)];
			}
		);
	}
	stop() {
		betterdiscord.Patcher.unpatchAll();
	}
}

module.exports = BDToolbox;

/*@end@*/