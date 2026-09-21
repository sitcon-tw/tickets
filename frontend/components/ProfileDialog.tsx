"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import type { Passkey } from "@sitcontix/types";
import { KeyRound, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export const MAX_NAME_LENGTH = 50;

type ProfileDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: { name?: string; email?: string };
	onNameUpdated: (name: string) => void;
};

function isWebAuthnCancel(error: unknown): boolean {
	return error instanceof Error && (error.name === "NotAllowedError" || error.name === "AbortError");
}

export default function ProfileDialog({ open, onOpenChange, user, onNameUpdated }: ProfileDialogProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [name, setName] = useState(user.name ?? "");
	const [isSavingName, setIsSavingName] = useState(false);
	const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
	const [isAddingPasskey, setIsAddingPasskey] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "個人資料", "zh-Hans": "个人资料", en: "Profile" },
		description: { "zh-Hant": "管理您的名稱與通行金鑰", "zh-Hans": "管理您的名称与通行密钥", en: "Manage your name and passkeys" },
		name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		nameSaved: { "zh-Hant": "名稱已更新", "zh-Hans": "名称已更新", en: "Name updated" },
		nameInvalid: {
			"zh-Hant": `名稱需為 1 至 ${MAX_NAME_LENGTH} 個字元`,
			"zh-Hans": `名称需为 1 至 ${MAX_NAME_LENGTH} 个字符`,
			en: `Name must be 1 to ${MAX_NAME_LENGTH} characters`
		},
		passkeys: { "zh-Hant": "通行金鑰", "zh-Hans": "通行密钥", en: "Passkeys" },
		passkeysHint: {
			"zh-Hant": "使用指紋、臉部辨識或裝置密碼登入，不需等待登入信。",
			"zh-Hans": "使用指纹、面部识别或设备密码登录，无需等待登录信。",
			en: "Sign in with your fingerprint, face, or device PIN — no email needed."
		},
		noPasskeys: { "zh-Hant": "尚未新增通行金鑰", "zh-Hans": "尚未添加通行密钥", en: "No passkeys yet" },
		addPasskey: { "zh-Hant": "新增通行金鑰", "zh-Hans": "添加通行密钥", en: "Add passkey" },
		passkeyAdded: { "zh-Hant": "已新增通行金鑰", "zh-Hans": "已添加通行密钥", en: "Passkey added" },
		passkeyDeleted: { "zh-Hant": "已移除通行金鑰", "zh-Hans": "已移除通行密钥", en: "Passkey removed" },
		passkeyExists: { "zh-Hant": "此裝置已註冊過通行金鑰", "zh-Hans": "此设备已注册过通行密钥", en: "This device already has a passkey" },
		sessionNotFresh: {
			"zh-Hant": "為了安全，請重新登入後再新增通行金鑰",
			"zh-Hans": "为了安全，请重新登录后再添加通行密钥",
			en: "For security, please sign in again before adding a passkey"
		},
		unsupported: { "zh-Hant": "此瀏覽器不支援通行金鑰", "zh-Hans": "此浏览器不支持通行密钥", en: "This browser doesn't support passkeys" },
		remove: { "zh-Hant": "移除", "zh-Hans": "移除", en: "Remove" },
		unnamed: { "zh-Hant": "通行金鑰", "zh-Hans": "通行密钥", en: "Passkey" },
		synced: { "zh-Hant": "已同步", "zh-Hans": "已同步", en: "Synced" },
		addedOn: { "zh-Hant": "新增於", "zh-Hans": "添加于", en: "Added" },
		error: { "zh-Hant": "發生錯誤，請稍後再試", "zh-Hans": "发生错误，请稍后再试", en: "Something went wrong. Please try again" }
	});

	const loadPasskeys = useCallback(async () => {
		try {
			setPasskeys(await authAPI.listPasskeys());
		} catch (error) {
			console.error("Failed to load passkeys:", error);
			setPasskeys([]);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		setName(user.name ?? "");
		void loadPasskeys();
	}, [open, user.name, loadPasskeys]);

	const trimmedName = name.trim();
	const nameChanged = trimmedName !== (user.name ?? "");

	async function saveName() {
		if (isSavingName || !nameChanged) return;
		if (trimmedName.length < 1 || trimmedName.length > MAX_NAME_LENGTH) {
			showAlert(t.nameInvalid, "error");
			return;
		}
		setIsSavingName(true);
		try {
			await authAPI.updateName(trimmedName);
			onNameUpdated(trimmedName);
			showAlert(t.nameSaved, "success");
		} catch (error) {
			console.error("Failed to update name:", error);
			showAlert(error instanceof Error ? error.message : t.error, "error");
		} finally {
			setIsSavingName(false);
		}
	}

	async function addPasskey() {
		if (isAddingPasskey) return;
		if (typeof window === "undefined" || !window.PublicKeyCredential) {
			showAlert(t.unsupported, "error");
			return;
		}
		setIsAddingPasskey(true);
		try {
			await authAPI.addPasskey();
			showAlert(t.passkeyAdded, "success");
			await loadPasskeys();
		} catch (error) {
			if (isWebAuthnCancel(error)) return;
			console.error("Failed to add passkey:", error);
			if (error instanceof Error && error.name === "InvalidStateError") {
				showAlert(t.passkeyExists, "error");
			} else if (error instanceof Error && error.message.toLowerCase().includes("fresh")) {
				showAlert(t.sessionNotFresh, "error");
			} else {
				showAlert(t.error, "error");
			}
		} finally {
			setIsAddingPasskey(false);
		}
	}

	async function deletePasskey(id: string) {
		if (deletingId) return;
		setDeletingId(id);
		try {
			await authAPI.deletePasskey(id);
			setPasskeys(prev => prev?.filter(p => p.id !== id) ?? null);
			showAlert(t.passkeyDeleted, "success");
		} catch (error) {
			console.error("Failed to delete passkey:", error);
			showAlert(t.error, "error");
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="z-1200" overlayClassName="z-1100">
				<DialogHeader>
					<DialogTitle>{t.title}</DialogTitle>
					<DialogDescription>{user.email ? `${user.email} · ${t.description}` : t.description}</DialogDescription>
				</DialogHeader>

				<form
					className="space-y-2"
					onSubmit={e => {
						e.preventDefault();
						void saveName();
					}}
				>
					<Label htmlFor="profile-name">{t.name}</Label>
					<div className="flex gap-2">
						<Input id="profile-name" value={name} maxLength={MAX_NAME_LENGTH} onChange={e => setName(e.target.value)} autoComplete="name" />
						<Button type="submit" disabled={isSavingName || !nameChanged || trimmedName.length === 0}>
							{isSavingName && <Spinner size="sm" />}
							{t.save}
						</Button>
					</div>
				</form>

				<div className="space-y-3">
					<div>
						<h3 className="text-sm font-medium">{t.passkeys}</h3>
						<p className="text-xs text-muted-foreground">{t.passkeysHint}</p>
					</div>
					{passkeys === null ? (
						<div className="flex justify-center py-2">
							<Spinner size="sm" />
						</div>
					) : passkeys.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t.noPasskeys}</p>
					) : (
						<ul className="divide-y rounded-lg border">
							{passkeys.map(passkey => (
								<li key={passkey.id} className="flex items-center justify-between gap-2 px-3 py-2">
									<div className="flex items-center gap-2 min-w-0">
										<KeyRound className="size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0">
											<p className="text-sm truncate">{passkey.name || t.unnamed}</p>
											<p className="text-xs text-muted-foreground">
												{passkey.createdAt && `${t.addedOn} ${passkey.createdAt.toLocaleDateString(locale)}`}
												{passkey.backedUp && ` · ${t.synced}`}
											</p>
										</div>
									</div>
									<Button variant="ghost" size="icon" aria-label={t.remove} onClick={() => deletePasskey(passkey.id)} disabled={deletingId !== null}>
										{deletingId === passkey.id ? <Spinner size="sm" /> : <Trash2 className="size-4" />}
									</Button>
								</li>
							))}
						</ul>
					)}
					<Button variant="outline" onClick={addPasskey} disabled={isAddingPasskey} className="w-full">
						{isAddingPasskey ? <Spinner size="sm" /> : <KeyRound className="size-4" />}
						{t.addPasskey}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
