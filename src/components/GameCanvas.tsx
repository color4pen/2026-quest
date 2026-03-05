import { useRef, useEffect, useMemo, useState } from 'react';
import { TileType, GrassDecoration, TILE_SIZE, CameraState, MapObject } from '../types/game';
import { GameMapState } from '../models';
import { GameObject } from './game';
import { assetPath } from '../utils/assetPath';

function useImage(src: string): HTMLImageElement | null {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
    };
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return loaded ? imgRef.current : null;
}

interface GameCanvasProps {
  gameObjects: GameObject[];
  map: GameMapState;
  camera: CameraState;
}

/**
 * GameCanvas - ゲーム画面の描画を担当
 * カメラ追従型：ビューポート内のタイルのみ描画（フラスタムカリング）
 */
export function GameCanvas({ gameObjects, map, camera }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const villageImage = useImage(assetPath('/assets/images/tiles/village.jpg'));
  const caveImage = useImage(assetPath('/assets/images/tiles/cave.jpg'));
  const tentImage = useImage(assetPath('/assets/images/tiles/Tent-F.png'));

  const mapHeight = map.tiles.length;
  const mapWidth = map.tiles[0]?.length ?? 20;

  const sortedObjects = useMemo(
    () => [...gameObjects].sort((a, b) => a.zIndex - b.zIndex),
    [gameObjects],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 可視範囲を計算（フラスタムカリング）
    const halfW = camera.viewportWidth / 2;
    const halfH = camera.viewportHeight / 2;
    const startX = Math.max(0, Math.floor(camera.x - halfW));
    const startY = Math.max(0, Math.floor(camera.y - halfH));
    const endX = Math.min(mapWidth, Math.ceil(camera.x + halfW) + 1);
    const endY = Math.min(mapHeight, Math.ceil(camera.y + halfH) + 1);

    // 可視範囲のタイルのみ描画
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = map.tiles[y]?.[x];
        const decorations = map.grassDecorations[y]?.[x];
        if (tile) {
          drawTile(ctx, x, y, tile, decorations, camera);
        }
      }
    }

    // MapObject描画（村、洞窟、テント等）
    drawObjects(ctx, map.objects, camera, villageImage, caveImage, tentImage);

    // GameObjectを描画（ビューポート内のみ）
    sortedObjects.forEach(obj => {
      if (obj.active && obj.isInViewport(camera)) {
        obj.render(ctx, camera);
      }
    });

    // グリッド線（可視範囲のみ）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x++) {
      const screenX = (x - camera.x + halfW) * TILE_SIZE;
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
    }
    for (let y = startY; y <= endY; y++) {
      const screenY = (y - camera.y + halfH) * TILE_SIZE;
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
    }
    ctx.stroke();
  }, [gameObjects, map, mapHeight, mapWidth, camera, villageImage, caveImage, tentImage]);

  return (
    <div className="game-screen">
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width={640}
        height={480}
      />
    </div>
  );
}

// ==================== マップタイル描画 ====================

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: TileType,
  decorations: GrassDecoration[] | null,
  camera: CameraState,
) {
  // カメラからの相対位置を計算
  const px = (x - camera.x + camera.viewportWidth / 2) * TILE_SIZE;
  const py = (y - camera.y + camera.viewportHeight / 2) * TILE_SIZE;

  switch (type) {
    case 'grass':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5a8c69';
      if (decorations) {
        for (const decor of decorations) {
          ctx.fillRect(px + decor.x, py + decor.y, 2, 2);
        }
      }
      break;

    case 'tree':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(px + 10, py + 4, 12, 12);
      ctx.fillRect(px + 6, py + 8, 20, 8);
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(px + 13, py + 16, 6, 12);
      break;

    case 'path':
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // 道の模様
      ctx.fillStyle = '#9b8365';
      ctx.fillRect(px + 4, py + 8, 4, 4);
      ctx.fillRect(px + 20, py + 18, 4, 4);
      break;

    case 'water':
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5aa0f2';
      ctx.fillRect(px + 5, py + 5, 8, 3);
      ctx.fillRect(px + 18, py + 15, 6, 2);
      break;

    case 'floor':
      // 室内床（石畳風）
      ctx.fillStyle = '#6b6b7a';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5b5b6a';
      ctx.fillRect(px, py, 15, 15);
      ctx.fillRect(px + 16, py + 16, 15, 15);
      ctx.strokeStyle = '#4b4b5a';
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      break;

    case 'wall':
      // 壁（レンガ風）
      ctx.fillStyle = '#4a3a3a';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#5a4a4a';
      ctx.fillRect(px + 1, py + 1, 14, 6);
      ctx.fillRect(px + 17, py + 1, 14, 6);
      ctx.fillRect(px + 8, py + 9, 14, 6);
      ctx.fillRect(px + 1, py + 17, 14, 6);
      ctx.fillRect(px + 17, py + 17, 14, 6);
      ctx.fillRect(px + 8, py + 25, 14, 6);
      break;

    case 'stairs':
      // 階段（ワープポイント）
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // 階段模様
      ctx.fillStyle = '#6b5335';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(px + 4, py + 4 + i * 7, 24, 5);
      }
      // 光るエフェクト
      ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
      ctx.fillRect(px + 8, py + 8, 16, 16);
      break;

    case 'door':
      // 扉
      ctx.fillStyle = '#6b5335';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px + 4, py + 2, 24, 28);
      // ドアノブ
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px + 22, py + 16, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'sand':
      // 砂地
      ctx.fillStyle = '#d4b896';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#c4a886';
      ctx.fillRect(px + 5, py + 10, 3, 3);
      ctx.fillRect(px + 20, py + 5, 4, 3);
      ctx.fillRect(px + 12, py + 22, 3, 3);
      break;

    case 'bridge':
      // 橋（水の上に板）
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px, py + 8, TILE_SIZE, 16);
      // 板の隙間
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(px + 10, py + 8, 2, 16);
      ctx.fillRect(px + 22, py + 8, 2, 16);
      break;

    default:
      // 未知のタイル（デバッグ用）
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      break;
  }
}

// ==================== MapObject描画 ====================

function drawObjects(
  ctx: CanvasRenderingContext2D,
  objects: MapObject[] | undefined,
  camera: CameraState,
  villageImage: HTMLImageElement | null,
  caveImage: HTMLImageElement | null,
  tentImage: HTMLImageElement | null,
): void {
  if (!objects || objects.length === 0) return;

  const halfW = camera.viewportWidth / 2;
  const halfH = camera.viewportHeight / 2;

  for (const obj of objects) {
    // ビューポート外はスキップ
    if (
      obj.x + obj.width < camera.x - halfW ||
      obj.x > camera.x + halfW ||
      obj.y + obj.height < camera.y - halfH ||
      obj.y > camera.y + halfH
    ) {
      continue;
    }

    const px = (obj.x - camera.x + halfW) * TILE_SIZE;
    const py = (obj.y - camera.y + halfH) * TILE_SIZE;
    const pw = obj.width * TILE_SIZE;
    const ph = obj.height * TILE_SIZE;

    // 画像IDに基づいて描画
    switch (obj.image) {
      case 'village':
        // 背景（画像読み込み前のフォールバック）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        if (villageImage) {
          ctx.drawImage(villageImage, px, py, pw, ph);
        }
        break;

      case 'cave':
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        if (caveImage) {
          ctx.drawImage(caveImage, px, py, pw, ph);
        }
        break;

      case 'car':
        // 車（2x1タイル、プログラマティック描画）
        // 背景（草地）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        // 車体（青）
        ctx.fillStyle = '#3a5a8c';
        ctx.fillRect(px + 4, py + 8, pw - 8, ph - 12);
        // 屋根
        ctx.fillStyle = '#2a4a7c';
        ctx.fillRect(px + 16, py + 4, 24, 12);
        // 窓
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(px + 18, py + 6, 8, 8);
        ctx.fillRect(px + 28, py + 6, 8, 8);
        // タイヤ
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(px + 14, py + 26, 5, 0, Math.PI * 2);
        ctx.arc(px + 50, py + 26, 5, 0, Math.PI * 2);
        ctx.fill();
        // ヘッドライト
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(px + pw - 8, py + 14, 4, 4);
        break;

      case 'torii':
        // 鳥居（2x2タイル、湖の中に立つ赤い鳥居）
        // 背景（水）
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(px, py, pw, ph);
        // 柱（左右）
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(px + 8, py + 16, 8, ph - 16);   // 左柱
        ctx.fillRect(px + pw - 16, py + 16, 8, ph - 16); // 右柱
        // 笠木（上の横棒）
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(px + 2, py + 8, pw - 4, 10);
        // 島木（笠木の下の横棒）
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(px + 6, py + 20, pw - 12, 6);
        // 貫（中央の横棒）
        ctx.fillRect(px + 10, py + 36, pw - 20, 5);
        // 笠木の反り（装飾）
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(px, py + 6, 6, 6);
        ctx.fillRect(px + pw - 6, py + 6, 6, 6);
        break;

      case 'tent':
        // テント（5x5タイル、スプライトシートから切り出し）
        // 背景（草地）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        if (tentImage) {
          // スプライトシートからテント部分を切り出し（入口が見える大きいテント）
          // ソース: x=256, y=0, 幅=160, 高さ=160 (5x5ブロック)
          ctx.drawImage(
            tentImage,
            256, 0, 160, 160,   // ソース領域（入口付きテント）
            px, py, pw, ph      // 描画先
          );
        }
        break;

      case 'campfire':
        // 焚き火（2x2タイル）
        ctx.fillStyle = '#6b6b7a';
        ctx.fillRect(px, py, pw, ph);
        // 火の土台（石）
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2 + 8, 20, 0, Math.PI * 2);
        ctx.fill();
        // 炎
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py + 8);
        ctx.lineTo(px + pw / 2 - 12, py + ph / 2 + 8);
        ctx.lineTo(px + pw / 2 + 12, py + ph / 2 + 8);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py + 16);
        ctx.lineTo(px + pw / 2 - 6, py + ph / 2 + 4);
        ctx.lineTo(px + pw / 2 + 6, py + ph / 2 + 4);
        ctx.fill();
        break;

      case 'stove':
        // ストーブ（1x1タイル）
        ctx.fillStyle = '#6b6b7a';
        ctx.fillRect(px, py, pw, ph);
        // ストーブ本体
        ctx.fillStyle = '#333333';
        ctx.fillRect(px + 4, py + 8, pw - 8, ph - 12);
        // 上部
        ctx.fillStyle = '#444444';
        ctx.fillRect(px + 2, py + 4, pw - 4, 8);
        // 炎窓
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(px + 8, py + 16, pw - 16, 8);
        break;

      case 'table':
        // テーブル（2x1タイル）
        ctx.fillStyle = '#6b6b7a';
        ctx.fillRect(px, py, pw, ph);
        // テーブル天板
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(px + 2, py + 8, pw - 4, 12);
        // 脚
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(px + 6, py + 20, 6, 8);
        ctx.fillRect(px + pw - 12, py + 20, 6, 8);
        break;

      default:
        // 未知のオブジェクト（デバッグ用）
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(px, py, pw, ph);
        break;
    }
  }
}
