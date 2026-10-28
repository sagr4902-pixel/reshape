import { useMemo } from "react";
import * as THREE from "three";
import { noiseTex } from "../../cgi/textures";

/** Cast-iron change plates: a little less metallic than cgi/Equipment useIron so the stack
 * sides pick up the warm pin-spots instead of reading as black holes. */
export const useWarmIron = () =>
  useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2b2826",
        metalness: 0.5,
        roughness: 0.46,
        roughnessMap: noiseTex("iron", 4, 70),
        bumpMap: noiseTex("iron-bump", 6, 40),
        bumpScale: 0.5,
      }),
    [],
  );
