import { useRef, useEffect, useMemo, useState } from 'react';
import { TileType, GrassDecoration, TILE_SIZE, CameraState } from '../types/game';
import { GameMapState } from '../models';
import { GameObject } from './game';

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
  const villageImage = useImage('/assets/images/tiles/village.jpg');
  const caveImage = useImage('/assets/images/tiles/cave.jpg');

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
          drawTile(ctx, x, y, tile, decorations, camera, villageImage, caveImage);
        }
      }
    }

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
  }, [gameObjects, map, mapHeight, mapWidth, camera, villageImage, caveImage]);

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
  villageImage: HTMLImageElement | null,
  caveImage: HTMLImageElement | null,
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

    // === 村オブジェクト（2x2）- 画像を4分割 ===
    case 'village_tl':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (villageImage) {
        const hw = villageImage.naturalWidth / 2;
        const hh = villageImage.naturalHeight / 2;
        ctx.drawImage(villageImage, 0, 0, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'village_tr':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (villageImage) {
        const hw = villageImage.naturalWidth / 2;
        const hh = villageImage.naturalHeight / 2;
        ctx.drawImage(villageImage, hw, 0, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'village_bl':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (villageImage) {
        const hw = villageImage.naturalWidth / 2;
        const hh = villageImage.naturalHeight / 2;
        ctx.drawImage(villageImage, 0, hh, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'village_br':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (villageImage) {
        const hw = villageImage.naturalWidth / 2;
        const hh = villageImage.naturalHeight / 2;
        ctx.drawImage(villageImage, hw, hh, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    // === 洞窟オブジェクト（2x2）- 画像を4分割 ===
    case 'cave_tl':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (caveImage) {
        const hw = caveImage.naturalWidth / 2;
        const hh = caveImage.naturalHeight / 2;
        ctx.drawImage(caveImage, 0, 0, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'cave_tr':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (caveImage) {
        const hw = caveImage.naturalWidth / 2;
        const hh = caveImage.naturalHeight / 2;
        ctx.drawImage(caveImage, hw, 0, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'cave_bl':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (caveImage) {
        const hw = caveImage.naturalWidth / 2;
        const hh = caveImage.naturalHeight / 2;
        ctx.drawImage(caveImage, 0, hh, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    case 'cave_br':
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (caveImage) {
        const hw = caveImage.naturalWidth / 2;
        const hh = caveImage.naturalHeight / 2;
        ctx.drawImage(caveImage, hw, hh, hw, hh, px, py, TILE_SIZE, TILE_SIZE);
      }
      break;

    default:
      // 未知のタイル（デバッグ用）
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      break;
  }
}
