import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const T = {
  nsmIn: 500, // "NSM" flickers on in the dark
  light: 1100, // glow + rays illuminate the darkness
  expand: 2100, // NSM -> NextStep Mentorship
  seed: 2700, // a seed drops
  stem: 3200, // it sprouts
  leaves: 3750, // two leaves unfurl
  shrink: 4700, // NextStep Mentorship -> NSM
};
const EXPAND_MS = 1100;
const SHRINK_MS = 800;
const MIN_DISPLAY_MS = 5800; // total time before the preloader may exit
const EXIT_MS = 450;

const BG = "#090D16"; // matches the native splash color, so the hand-off is seamless
const RAY_COUNT = 14;

const MOTES = [
  { x: 0.1, y: 0.18, s: 3, d: 0 },
  { x: 0.82, y: 0.14, s: 2, d: 600 },
  { x: 0.28, y: 0.33, s: 2, d: 1200 },
  { x: 0.66, y: 0.28, s: 3, d: 300 },
  { x: 0.9, y: 0.46, s: 2, d: 900 },
  { x: 0.06, y: 0.55, s: 2, d: 1500 },
  { x: 0.38, y: 0.72, s: 3, d: 200 },
  { x: 0.74, y: 0.68, s: 2, d: 1100 },
  { x: 0.2, y: 0.86, s: 2, d: 700 },
  { x: 0.58, y: 0.9, s: 3, d: 1400 },
];

/* ------------------------------ Darkness ---------------------------- */

function Fog({ size, top, left, color, drift, duration, delay = 0 }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.get() - 0.5) * 2 * drift },
      { translateY: (0.5 - t.get()) * drift },
      { scale: 1 + t.get() * 0.15 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
}

// Dust that barely exists in the dark, then glints once the light arrives.
function Mote({ x, y, size, delay, width, height, light }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.04, 0.22 + 0.4 * light.get()]),
    transform: [
      { translateY: interpolate(t.get(), [0, 1], [10, -16]) },
      { translateX: interpolate(t.get(), [0, 1], [-4, 4]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x * width,
          top: y * height,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FFE9B0",
        },
        style,
      ]}
    />
  );
}

/* ------------------------------- Light ------------------------------ */

const GLOW_LAYERS = [
  [1, 0.03],
  [0.8, 0.04],
  [0.62, 0.06],
  [0.46, 0.08],
  [0.32, 0.11],
  [0.2, 0.16],
];

function Glow({ size, light, breath }) {
  const style = useAnimatedStyle(() => ({
    opacity: light.get(),
    transform: [
      { scale: (0.3 + 0.7 * light.get()) * (1 + 0.05 * breath.get()) },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {GLOW_LAYERS.map(([k, a]) => (
        <View
          key={k}
          style={{
            position: "absolute",
            width: size * k,
            height: size * k,
            borderRadius: (size * k) / 2,
            backgroundColor: `rgba(255, 214, 120, ${a})`,
          }}
        />
      ))}
    </Animated.View>
  );
}

function Ray({ index, angle, length, thickness, alpha, light }) {
  const style = useAnimatedStyle(() => {
    const start = index * 0.035;
    const p = interpolate(
      light.get(),
      [start, start + 0.55],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: p,
      transform: [{ rotate: `${angle}deg` }, { scale: 0.3 + 0.7 * p }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: thickness,
          height: length * 2,
          left: -thickness / 2,
          top: -length,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={["rgba(255,236,170,0)", `rgba(255,236,170,${alpha})`]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: length,
          borderRadius: thickness / 2,
        }}
      />
    </Animated.View>
  );
}

/* ------------------------------ The text ---------------------------- */

function Expander({ text, natural, progress, range, textStyle }) {
  const w = natural + 4;
  const style = useAnimatedStyle(() => {
    const p = interpolate(progress.get(), range, [0, 1], Extrapolation.CLAMP);
    return { width: w * p, opacity: p };
  });
  return (
    <Animated.View style={[{ overflow: "hidden" }, style]}>
      <Text numberOfLines={1} style={[textStyle, { width: w }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

function Spacer({ size, progress, range }) {
  const style = useAnimatedStyle(() => ({
    width:
      size * interpolate(progress.get(), range, [0, 1], Extrapolation.CLAMP),
  }));
  return <Animated.View style={style} />;
}

/* ------------------------------ The sprout -------------------------- */

function Sprout({ k, seed, stem, leafL, leafR, ring, sway }) {
  const SEED_W = 16 * k;
  const SEED_H = 10 * k;
  const STEM_W = 4 * k;
  const STEM_H = 52 * k;
  const LEAF = 30 * k;

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(sway.get(), [0, 1], [-3, 3])}deg` }],
  }));
  const groundStyle = useAnimatedStyle(() => ({ opacity: seed.get() }));
  const seedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, seed.get() * 5),
    transform: [{ translateY: interpolate(seed.get(), [0, 1], [-46, 0]) }],
  }));
  const stemStyle = useAnimatedStyle(() => ({
    height: STEM_H * stem.get(),
    opacity: Math.min(1, stem.get() * 6),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, leafL.get() * 3),
    transform: [
      { rotate: `${interpolate(leafL.get(), [0, 1], [30, 0])}deg` },
      { scale: leafL.get() },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, leafR.get() * 3),
    transform: [
      { rotate: `${interpolate(leafR.get(), [0, 1], [-30, 0])}deg` },
      { scale: leafR.get() },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.get(), [0, 0.15, 1], [0, 0.7, 0]),
    transform: [{ scale: interpolate(ring.get(), [0, 1], [0.3, 2.4]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 120 * k,
          height: SEED_H + STEM_H,
          alignItems: "center",
          justifyContent: "flex-end",
          transformOrigin: "50% 100%",
        },
        swayStyle,
      ]}
    >
      {/* expanding ring when the leaves open */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: STEM_H * 0.35,
            width: 44 * k,
            height: 44 * k,
            borderRadius: 22 * k,
            borderWidth: 1.5,
            borderColor: "rgba(134,239,172,0.8)",
          },
          ringStyle,
        ]}
      />

      {/* glowing ground under the seed */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -4 * k,
            width: 64 * k,
            height: 8 * k,
            borderRadius: 4 * k,
            backgroundColor: "rgba(255,214,120,0.28)",
          },
          groundStyle,
        ]}
      />

      {/* stem, with the two leaves riding on its tip */}
      <Animated.View
        style={[
          {
            width: STEM_W,
            borderRadius: STEM_W / 2,
            backgroundColor: "#22C55E",
            marginBottom: -3 * k,
          },
          stemStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: -LEAF * 0.75,
              right: 1,
              width: LEAF,
              height: LEAF,
              borderTopRightRadius: LEAF,
              borderBottomLeftRadius: LEAF,
              overflow: "hidden",
              transformOrigin: "100% 100%",
            },
            leftStyle,
          ]}
        >
          <LinearGradient
            colors={["#86EFAC", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            {
              position: "absolute",
              top: -LEAF * 0.75,
              left: 1,
              width: LEAF,
              height: LEAF,
              borderTopLeftRadius: LEAF,
              borderBottomRightRadius: LEAF,
              overflow: "hidden",
              transformOrigin: "0% 100%",
            },
            rightStyle,
          ]}
        >
          <LinearGradient
            colors={["#86EFAC", "#15803D"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      {/* the seed */}
      <Animated.View
        style={[
          {
            width: SEED_W,
            height: SEED_H,
            borderRadius: SEED_H,
            backgroundColor: "#D9A441",
          },
          seedStyle,
        ]}
      />
    </Animated.View>
  );
}

/* -------------------------------- Screen ---------------------------- */

export default function Preloader({ onFinish, isReady = true }) {
  const { width, height } = useWindowDimensions();

  const fontSize = Math.min(40, Math.max(22, width * 0.062));
  const k = fontSize / 24; // scales the sprout with the text
  const rayReach = Math.hypot(width, height) / 2;

  // Natural widths of the expanding segments (measured off-screen).
  const [natural, setNatural] = useState({ ext: 0, tep: 0, entorship: 0 });
  const measure = (key) => (e) => {
    const w = e.nativeEvent.layout.width;
    setNatural((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
  };

  const [introDone, setIntroDone] = useState(false);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const nsm = useSharedValue(0);
  const light = useSharedValue(0);
  const breath = useSharedValue(0);
  const spin = useSharedValue(0);
  const expand = useSharedValue(0);
  const seed = useSharedValue(0);
  const stem = useSharedValue(0);
  const leafL = useSharedValue(0);
  const leafR = useSharedValue(0);
  const ring = useSharedValue(0);
  const sway = useSharedValue(0);
  const exit = useSharedValue(1);

  useEffect(() => {
    // NSM flickers on, as if struggling to exist in the dark.
    nsm.set(
      withDelay(
        T.nsmIn,
        withSequence(
          withTiming(0.25, { duration: 120 }),
          withTiming(0.05, { duration: 140 }),
          withTiming(0.55, { duration: 160 }),
          withTiming(0.15, { duration: 200 }),
          withTiming(1, { duration: 380 }),
        ),
      ),
    );

    // Light arrives, then keeps breathing.
    light.set(
      withDelay(
        T.light,
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
      ),
    );
    breath.set(
      withDelay(
        T.light + 1200,
        withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );
    spin.set(
      withRepeat(
        withTiming(360, { duration: 70000, easing: Easing.linear }),
        -1,
        false,
      ),
    );

    // NSM -> NextStep Mentorship -> NSM
    expand.set(
      withDelay(
        T.expand,
        withSequence(
          withTiming(1, {
            duration: EXPAND_MS,
            easing: Easing.out(Easing.cubic),
          }),
          withDelay(
            T.shrink - T.expand - EXPAND_MS,
            withTiming(0, {
              duration: SHRINK_MS,
              easing: Easing.inOut(Easing.cubic),
            }),
          ),
        ),
      ),
    );

    // Seed -> stem -> two leaves
    seed.set(
      withDelay(
        T.seed,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.bounce) }),
      ),
    );
    stem.set(
      withDelay(
        T.stem,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      ),
    );
    leafL.set(
      withDelay(
        T.leaves,
        withTiming(1, {
          duration: 800,
          easing: Easing.out(Easing.back(1.6)),
        }),
      ),
    );
    leafR.set(
      withDelay(
        T.leaves + 140,
        withTiming(1, {
          duration: 800,
          easing: Easing.out(Easing.back(1.6)),
        }),
      ),
    );
    ring.set(
      withDelay(
        T.leaves + 300,
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      ),
    );
    sway.set(
      withDelay(
        T.leaves + 800,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      ),
    );

    const id = setTimeout(() => setIntroDone(true), MIN_DISPLAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit once the story has played AND the app is ready.
  useEffect(() => {
    if (!introDone || !isReady) return;
    exit.set(
      withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }),
    );
    const id = setTimeout(() => onFinishRef.current?.(), EXIT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, isReady]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: exit.get() }));
  const fogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(light.get(), [0, 1], [1, 0.4]),
  }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.get()}deg` }],
  }));
  const nsmStyle = useAnimatedStyle(() => ({
    opacity: nsm.get(),
    transform: [{ scale: interpolate(nsm.get(), [0, 1], [0.94, 1]) }],
  }));

  const initial = {
    fontSize,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textShadowColor: "rgba(255,224,130,0.55)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  };
  const rest = { ...initial, fontWeight: "600", color: "#EDE9E0" };

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      {/* 1. Darkness: slow, heavy fog and almost-invisible dust */}
      <Animated.View
        style={[StyleSheet.absoluteFill, fogStyle]}
        pointerEvents="none"
      >
        <Fog
          size={width * 1.1}
          top={-width * 0.3}
          left={-width * 0.4}
          color="rgba(49,46,129,0.30)"
          drift={40}
          duration={9000}
        />
        <Fog
          size={width * 0.9}
          top={height * 0.5}
          left={width * 0.3}
          color="rgba(88,28,135,0.22)"
          drift={50}
          duration={11000}
          delay={800}
        />
        <Fog
          size={width * 0.7}
          top={height * 0.25}
          left={-width * 0.2}
          color="rgba(30,41,59,0.55)"
          drift={30}
          duration={8000}
          delay={400}
        />
      </Animated.View>
      {MOTES.map((m, i) => (
        <Mote
          key={i}
          {...m}
          x={m.x}
          y={m.y}
          size={m.s}
          delay={m.d}
          width={width}
          height={height}
          light={light}
        />
      ))}

      {/* 2. Light: glow and rays radiating from behind NSM */}
      <View style={styles.fill} pointerEvents="none">
        <Glow
          size={Math.hypot(width, height) * 0.8}
          light={light}
          breath={breath}
        />
        <Animated.View style={[{ width: 0, height: 0 }, spinStyle]}>
          {Array.from({ length: RAY_COUNT }).map((_, i) => {
            const long = i % 2 === 0;
            return (
              <Ray
                key={i}
                index={i}
                angle={(360 / RAY_COUNT) * i}
                length={rayReach * (long ? 1 : 0.68)}
                thickness={long ? 14 : 8}
                alpha={long ? 0.3 : 0.22}
                light={light}
              />
            );
          })}
        </Animated.View>
      </View>

      {/* 3. NSM / NextStep Mentorship, with the sprout growing beneath it */}
      <View style={styles.fill} pointerEvents="none">
        <View
          style={[
            styles.centerContainer,
            { transform: [{ translateY: height * 0.06 }] },
          ]}
        >
          <Animated.View style={[styles.row, nsmStyle]}>
            <Text style={initial}>N</Text>
            <Expander
              text="ext"
              natural={natural.ext}
              progress={expand}
              range={[0, 0.4]}
              textStyle={rest}
            />
            <Text style={initial}>S</Text>
            <Expander
              text="tep"
              natural={natural.tep}
              progress={expand}
              range={[0.2, 0.6]}
              textStyle={rest}
            />
            <Spacer
              size={fontSize * 0.32}
              progress={expand}
              range={[0.4, 0.65]}
            />
            <Text style={initial}>M</Text>
            <Expander
              text="entorship"
              natural={natural.entorship}
              progress={expand}
              range={[0.5, 1]}
              textStyle={rest}
            />
          </Animated.View>

          <View style={[styles.sproutSlot, { marginTop: 16 * k }]}>
            <Sprout
              k={k}
              seed={seed}
              stem={stem}
              leafL={leafL}
              leafR={leafR}
              ring={ring}
              sway={sway}
            />
          </View>
        </View>
      </View>

      {/* Off-screen measurer for the expanding segments */}
      <View style={styles.measurer} pointerEvents="none">
        <Text style={rest} onLayout={measure("ext")}>
          ext
        </Text>
        <Text style={rest} onLayout={measure("tep")}>
          tep
        </Text>
        <Text style={rest} onLayout={measure("entorship")}>
          entorship
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    overflow: "hidden",
  },

  fill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  sproutSlot: {
    alignItems: "center",
    justifyContent: "center",
  },

  measurer: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0,
    flexDirection: "row",
  },
});
