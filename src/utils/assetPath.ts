/**
 * アセットパスをベースURLに対応させる
 * GitHub Pages等でサブディレクトリにデプロイする場合に必要
 */
export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  // パスが / で始まる場合は除去してbaseと結合
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
