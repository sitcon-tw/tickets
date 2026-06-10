import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

type DecryptedTextAnimationState = {
	displayText: string;
	isScrambling: boolean;
	revealedIndices: Set<number>;
};

type DecryptedTextAnimationAction =
	| { type: "start"; text: string }
	| { type: "reset" }
	| { type: "stop" }
	| { type: "snapshot"; displayText: string; revealedIndices: Set<number> }
	| { type: "finish"; text: string; revealedIndices: Set<number> };

function decryptedTextAnimationReducer(state: DecryptedTextAnimationState, action: DecryptedTextAnimationAction): DecryptedTextAnimationState {
	switch (action.type) {
		case "start":
			return { displayText: action.text, isScrambling: true, revealedIndices: new Set() };
		case "reset":
			return { ...state, isScrambling: false, revealedIndices: new Set() };
		case "stop":
			return { ...state, isScrambling: false };
		case "snapshot":
			return { displayText: action.displayText, isScrambling: true, revealedIndices: action.revealedIndices };
		case "finish":
			return { displayText: action.text, isScrambling: false, revealedIndices: action.revealedIndices };
		default:
			return state;
	}
}

function getNextIndex(revealedSet: Set<number>, currentText: string, direction: "start" | "end" | "center") {
	const textLength = currentText.length;
	switch (direction) {
		case "start":
			return revealedSet.size;
		case "end":
			return textLength - 1 - revealedSet.size;
		case "center": {
			const middle = Math.floor(textLength / 2);
			const offset = Math.floor(revealedSet.size / 2);
			const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

			if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
				return nextIndex;
			}

			for (let i = 0; i < textLength; i++) {
				if (!revealedSet.has(i)) return i;
			}
			return 0;
		}
		default:
			return revealedSet.size;
	}
}

function shuffleText(originalText: string, currentRevealed: Set<number>, useOriginalChars: boolean, characterSet: string) {
	const availableChars = useOriginalChars ? Array.from(new Set(originalText.split(""))).filter(char => char !== " ") : characterSet.split("");

	if (useOriginalChars) {
		const positions = originalText.split("").map((char, i) => ({
			char,
			isSpace: char === " ",
			index: i,
			isRevealed: currentRevealed.has(i)
		}));

		const nonSpaceChars = positions.flatMap(p => (!p.isSpace && !p.isRevealed ? [p.char] : []));

		for (let i = nonSpaceChars.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]];
		}

		let charIndex = 0;
		return positions
			.map(p => {
				if (p.isSpace) return " ";
				if (p.isRevealed) return originalText[p.index];
				return nonSpaceChars[charIndex++];
			})
			.join("");
	}

	return originalText
		.split("")
		.map((char, i) => {
			if (char === " ") return " ";
			if (currentRevealed.has(i)) return originalText[i];
			return availableChars[Math.floor(Math.random() * availableChars.length)];
		})
		.join("");
}

export default function DecryptedText({
	text,
	speed = 50,
	maxIterations = 10,
	sequential = false,
	revealDirection = "start",
	useOriginalCharsOnly = false,
	characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
	className = "",
	parentClassName = "",
	encryptedClassName = "",
	animateOn = "hover",
	...props
}: {
	text: string;
	speed?: number;
	maxIterations?: number;
	sequential?: boolean;
	revealDirection?: "start" | "end" | "center";
	useOriginalCharsOnly?: boolean;
	characters?: string;
	className?: string;
	parentClassName?: string;
	encryptedClassName?: string;
	animateOn?: string;
}) {
	const [isHovering, setIsHovering] = useState(false);
	const [{ displayText, isScrambling, revealedIndices }, dispatchAnimation] = useReducer(decryptedTextAnimationReducer, {
		displayText: "",
		isScrambling: false,
		revealedIndices: new Set<number>()
	});
	const hasAnimatedRef = useRef(false);
	const containerRef = useRef(null);
	const shouldReduceMotion = useReducedMotion();
	const animationRef = useRef({ text, speed, maxIterations, sequential, revealDirection, useOriginalCharsOnly, characters });
	animationRef.current = { text, speed, maxIterations, sequential, revealDirection, useOriginalCharsOnly, characters };

	useEffect(() => {
		if (shouldReduceMotion) {
			dispatchAnimation({ type: "stop" });
			return;
		}

		let interval: string | number | NodeJS.Timeout | undefined;
		let currentIteration = 0;
		let currentRevealed = new Set<number>();

		if (isHovering) {
			dispatchAnimation({ type: "start", text: animationRef.current.text });
			interval = setInterval(() => {
				const currentAnimation = animationRef.current;
				if (currentAnimation.sequential) {
					if (currentRevealed.size < currentAnimation.text.length) {
						const nextIndex = getNextIndex(currentRevealed, currentAnimation.text, currentAnimation.revealDirection);
						currentRevealed = new Set(currentRevealed);
						currentRevealed.add(nextIndex);
						dispatchAnimation({
							type: "snapshot",
							displayText: shuffleText(currentAnimation.text, currentRevealed, currentAnimation.useOriginalCharsOnly, currentAnimation.characters),
							revealedIndices: currentRevealed
						});
					} else {
						clearInterval(interval);
						dispatchAnimation({ type: "stop" });
					}
				} else {
					const nextText = shuffleText(currentAnimation.text, currentRevealed, currentAnimation.useOriginalCharsOnly, currentAnimation.characters);
					currentIteration++;
					if (currentIteration >= currentAnimation.maxIterations) {
						clearInterval(interval);
						dispatchAnimation({ type: "finish", text: currentAnimation.text, revealedIndices: currentRevealed });
					} else {
						dispatchAnimation({ type: "snapshot", displayText: nextText, revealedIndices: currentRevealed });
					}
				}
			}, animationRef.current.speed);
		} else {
			dispatchAnimation({ type: "reset" });
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isHovering, shouldReduceMotion]);

	useEffect(() => {
		if (shouldReduceMotion) return;
		if (animateOn !== "view" && animateOn !== "both") return;

		const observerCallback = (entries: IntersectionObserverEntry[]) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !hasAnimatedRef.current) {
					setIsHovering(true);
					hasAnimatedRef.current = true;
				}
			});
		};

		const observerOptions = {
			root: null,
			rootMargin: "0px",
			threshold: 0.1
		};

		const observer = new IntersectionObserver(observerCallback, observerOptions);
		const currentRef = containerRef.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, [animateOn, shouldReduceMotion]);

	const hoverProps =
		!shouldReduceMotion && (animateOn === "hover" || animateOn === "both")
			? {
					onMouseEnter: () => setIsHovering(true),
					onMouseLeave: () => setIsHovering(false)
				}
			: {};
	const visibleText = shouldReduceMotion || !isHovering || !isScrambling ? text : displayText;
	const characterSlots = useMemo(() => Array.from({ length: text.length }, (_, index) => `char-${index}`), [text.length]);

	return (
		<LazyMotion features={domAnimation}>
			<m.span className={`inline-block whitespace-pre-wrap ${parentClassName}`} ref={containerRef} {...hoverProps} {...props}>
				<span className="absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] border-0">{visibleText}</span>

				<span aria-hidden="true">
					{characterSlots.map((slotKey, index) => {
						const char = visibleText[index] ?? "";
						const isRevealedOrDone = revealedIndices.has(index) || !isScrambling || !isHovering;

						return (
							<span key={slotKey} className={isRevealedOrDone ? className : encryptedClassName}>
								{char}
							</span>
						);
					})}
				</span>
			</m.span>
		</LazyMotion>
	);
}
