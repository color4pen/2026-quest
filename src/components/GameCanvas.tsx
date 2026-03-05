import { useRef, useEffect, useMemo, useState } from 'react';
import { TileType, GrassDecoration, TILE_SIZE, CameraState, MapObject, NPCType } from '../types/game';
import { RenderableEntity } from '../types/rendering';
import { GameMapState } from '../models';
import { PlayerState } from '../models/Player';
import { EnemyState } from '../models/Enemy';
import { NPCState } from '../models/NPC';
import { TreasureState } from '../models/Treasure';
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
  entities: RenderableEntity[];
  map: GameMapState;
  camera: CameraState;
}

/**
 * GameCanvas - ゲーム画面の描画を担当
 * カメラ追従型：ビューポート内のタイルのみ描画（フラスタムカリング）
 * ドメインモデルから受け取った状態（RenderableEntity）に基づいて型別に描画。
 */
export function GameCanvas({ entities, map, camera }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const villageImage = useImage(assetPath('/assets/images/tiles/village.jpg'));
  const caveImage = useImage(assetPath('/assets/images/tiles/cave.jpg'));
  const tentImage = useImage(assetPath('/assets/images/tiles/Tent-F.png'));

  const mapHeight = map.tiles.length;
  const mapWidth = map.tiles[0]?.length ?? 20;

  // ビューポート内のアクティブなエンティティのみ
  const visibleEntities = useMemo(() => {
    const halfW = camera.viewportWidth / 2;
    const halfH = camera.viewportHeight / 2;

    return entities.filter(e =>
      e.active &&
      e.x >= camera.x - halfW - 1 &&
      e.x <= camera.x + halfW + 1 &&
      e.y >= camera.y - halfH - 1 &&
      e.y <= camera.y + halfH + 1
    );
  }, [entities, camera]);

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

    // エンティティを型別に描画
    visibleEntities.forEach(entity => {
      drawEntity(ctx, entity, camera);
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
  }, [visibleEntities, map, mapHeight, mapWidth, camera, villageImage, caveImage, tentImage]);

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

      case 'car_gray':
        // 車（灰色、2x1タイル）
        // 背景（草地）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        // 車体（灰色）
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(px + 4, py + 8, pw - 8, ph - 12);
        // 屋根
        ctx.fillStyle = '#5a5a5a';
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

      case 'none':
        // 描画しない（他のオブジェクトで描画済み）
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
        ctx.fillStyle = '#4a7c59';
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

      case 'stove_cylinder':
        // 円柱ストーブ（1x1タイル）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        // 煙突
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(px + 12, py + 2, 8, 10);
        // 円柱本体
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph - 8, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px + 4, py + 10, 24, ph - 18);
        // 上部（楕円）
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + 10, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 炎窓
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(px + 10, py + 16, 12, 6);
        break;

      case 'table':
        // テーブル（2x1タイル）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        // テーブル天板
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(px + 2, py + 8, pw - 4, 12);
        // 脚
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(px + 6, py + 20, 6, 8);
        ctx.fillRect(px + pw - 12, py + 20, 6, 8);
        break;

      case 'montbell_chair':
        // モンベルの椅子（1x1タイル、青いアウトドアチェア）
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, pw, ph);
        // 脚（X型フレーム）
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 28);
        ctx.lineTo(px + 26, py + 12);
        ctx.lineTo(px + 28, py + 14);
        ctx.lineTo(px + 8, py + 30);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 26, py + 28);
        ctx.lineTo(px + 6, py + 12);
        ctx.lineTo(px + 4, py + 14);
        ctx.lineTo(px + 24, py + 30);
        ctx.fill();
        // 座面（青）
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(px + 4, py + 10, 24, 10);
        // 背もたれ（青）
        ctx.fillStyle = '#004499';
        ctx.fillRect(px + 6, py + 4, 20, 8);
        break;

      default:
        // 未知のオブジェクト（デバッグ用）
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(px, py, pw, ph);
        break;
    }
  }
}

// ==================== エンティティ描画（型ベースディスパッチ） ====================

/**
 * ピクセル座標を取得（カメラ座標を考慮）
 */
function getPixelPosition(x: number, y: number, camera: CameraState): { px: number; py: number } {
  const screenX = (x - camera.x + camera.viewportWidth / 2) * TILE_SIZE;
  const screenY = (y - camera.y + camera.viewportHeight / 2) * TILE_SIZE;
  return { px: screenX, py: screenY };
}

/**
 * エンティティを型別に描画
 */
function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: RenderableEntity,
  camera: CameraState,
): void {
  switch (entity.entityType) {
    case 'player':
      drawPlayer(ctx, entity, camera);
      break;
    case 'enemy':
      drawEnemy(ctx, entity, camera);
      break;
    case 'npc':
      drawNPC(ctx, entity, camera);
      break;
    case 'treasure':
      drawTreasure(ctx, entity, camera);
      break;
  }
}

/**
 * プレイヤー描画
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: PlayerState,
  camera: CameraState,
): void {
  const { px, py } = getPixelPosition(state.x, state.y, camera);

  // 体
  ctx.fillStyle = '#e94560';
  ctx.fillRect(px + 8, py + 12, 16, 12);

  // 頭
  ctx.fillStyle = '#ffdbac';
  ctx.fillRect(px + 10, py + 6, 12, 10);

  // 髪
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(px + 10, py + 4, 12, 4);

  // 目
  ctx.fillStyle = '#000';
  ctx.fillRect(px + 12, py + 10, 2, 2);
  ctx.fillRect(px + 18, py + 10, 2, 2);

  // 剣
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(px + 24, py + 14, 4, 8);
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(px + 24, py + 20, 4, 3);

  // 脚
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(px + 10, py + 24, 6, 4);
  ctx.fillRect(px + 16, py + 24, 6, 4);
}

/**
 * 敵描画
 */
function drawEnemy(
  ctx: CanvasRenderingContext2D,
  state: EnemyState,
  camera: CameraState,
): void {
  const { px, py } = getPixelPosition(state.x, state.y, camera);

  // 体
  ctx.fillStyle = '#3d7c3f';
  ctx.fillRect(px + 6, py + 10, 20, 14);
  ctx.fillRect(px + 4, py + 14, 24, 10);

  // 目
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(px + 10, py + 16, 4, 4);
  ctx.fillRect(px + 18, py + 16, 4, 4);

  // ハイライト
  ctx.fillStyle = '#5a9c5c';
  ctx.fillRect(px + 8, py + 12, 6, 4);
}

/**
 * NPC種別から色設定を取得
 */
function getNPCColorsForType(type: NPCType): {
  bodyColor: string;
  hairColor: string;
  legsColor: string;
  iconColor: string;
} {
  switch (type) {
    case 'villager':
      return {
        bodyColor: '#6b8e23',
        hairColor: '#4a3728',
        legsColor: '#3d2817',
        iconColor: '#ffffff',
      };
    case 'shopkeeper':
      return {
        bodyColor: '#daa520',
        hairColor: '#2f4f4f',
        legsColor: '#3d2817',
        iconColor: '#ffd700',
      };
    case 'innkeeper':
      return {
        bodyColor: '#4169e1',
        hairColor: '#8b4513',
        legsColor: '#3d2817',
        iconColor: '#87ceeb',
      };
    default:
      return {
        bodyColor: '#6b8e23',
        hairColor: '#4a3728',
        legsColor: '#3d2817',
        iconColor: '#ffffff',
      };
  }
}

/**
 * NPC描画
 */
function drawNPC(
  ctx: CanvasRenderingContext2D,
  state: NPCState,
  camera: CameraState,
): void {
  const { px, py } = getPixelPosition(state.x, state.y, camera);

  // renderTypeがcomputerの場合は別の描画
  if (state.renderType === 'computer') {
    drawComputer(ctx, px, py);
    return;
  }

  // NPC種別に応じた色
  const colors = getNPCColorsForType(state.type);

  // 体
  ctx.fillStyle = colors.bodyColor;
  ctx.fillRect(px + 8, py + 12, 16, 12);

  // 頭
  ctx.fillStyle = '#ffdbac';
  ctx.fillRect(px + 10, py + 6, 12, 10);

  // 髪
  ctx.fillStyle = colors.hairColor;
  ctx.fillRect(px + 10, py + 4, 12, 4);

  // 目
  ctx.fillStyle = '#000';
  ctx.fillRect(px + 12, py + 10, 2, 2);
  ctx.fillRect(px + 18, py + 10, 2, 2);

  // 脚
  ctx.fillStyle = colors.legsColor;
  ctx.fillRect(px + 10, py + 24, 6, 4);
  ctx.fillRect(px + 16, py + 24, 6, 4);

  // NPC種別アイコン
  ctx.fillStyle = colors.iconColor;
  ctx.fillRect(px + 24, py + 4, 6, 6);
}

/**
 * パソコン描画
 */
function drawComputer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
): void {
  // モニター外枠
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(px + 4, py + 4, 24, 18);

  // モニター画面
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(px + 6, py + 6, 20, 14);

  // 画面の文字（緑色のターミナル風）
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(px + 8, py + 8, 8, 2);
  ctx.fillRect(px + 8, py + 12, 12, 2);
  ctx.fillRect(px + 8, py + 16, 6, 2);

  // カーソル点滅風
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(px + 16, py + 16, 3, 2);

  // モニタースタンド
  ctx.fillStyle = '#3c3c3c';
  ctx.fillRect(px + 13, py + 22, 6, 3);
  ctx.fillRect(px + 10, py + 25, 12, 2);

  // キーボード
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(px + 4, py + 28, 24, 4);

  // キーボードのキー
  ctx.fillStyle = '#6a6a6a';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(px + 6 + i * 4, py + 29, 3, 2);
  }
}

/**
 * 宝箱描画
 */
function drawTreasure(
  ctx: CanvasRenderingContext2D,
  state: TreasureState,
  camera: CameraState,
): void {
  // 開封済みは描画しない
  if (state.opened) return;

  const { px, py } = getPixelPosition(state.x, state.y, camera);

  // 宝箱
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(px + 8, py + 14, 16, 10);

  // 金具
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(px + 14, py + 18, 4, 4);
  ctx.fillRect(px + 10, py + 14, 12, 2);
}
