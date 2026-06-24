import {
  ShaderMount,
  grainGradientFragmentShader,
  GrainGradientShapes,
  ShaderFitOptions,
  getShaderColorFromString,
  getShaderNoiseTexture,
} from "@paper-design/shaders";

function waitForImage(img: HTMLImageElement): Promise<HTMLImageElement> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve(img);
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

/**
 * Mounts the static grainy purple gradient background onto #bg.
 * Returns a Promise so the caller can fire-and-forget without blocking content.
 */
export async function mountBackground(target: HTMLElement): Promise<ShaderMount> {
  const noiseImg = getShaderNoiseTexture();
  if (noiseImg) await waitForImage(noiseImg);

  const colors = ["#6C40FF", "#8B5CF6", "#C4B5FD", "#0D0E12"].map(
    getShaderColorFromString,
  );

  const uniforms = {
    u_fit: ShaderFitOptions.cover,
    u_scale: 1,
    u_rotation: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_offsetX: 0,
    u_offsetY: 0,
    u_worldWidth: 1440,
    u_worldHeight: 900,
    u_colorBack: getShaderColorFromString("#0D0E12"),
    u_colors: colors,
    u_colorsCount: colors.length,
    u_softness: 0.7,
    u_intensity: 0.45,
    u_noise: 0.25,
    u_shape: GrainGradientShapes.corners,
    u_noiseTexture: noiseImg,
  };

  return new ShaderMount(
    target,
    grainGradientFragmentShader,
    uniforms,
    undefined,
    0,
    0,
    undefined,
    undefined,
    ["u_noiseTexture"],
  );
}
