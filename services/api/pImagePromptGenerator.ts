/**
 * P-IMAGE Prompt Generator
 * Generates intelligent English prompts for clothing transfer
 * Preserves person's features while applying clothing items
 */

export interface PromptGeneratorOptions {
  preserveFace?: boolean;
  preserveHair?: boolean;
  preserveBodyShape?: boolean;
  clothingItemsCount: number;
}

/**
 * Generates an intelligent English prompt for P-IMAGE API
 * that preserves the person's facial features and hair while applying clothing
 */
export function generateClothingTransferPrompt(
  options: PromptGeneratorOptions
): string {
  // Fixed prompt as per user requirements
  const fullPrompt = `[Modification]
Dress the person in the clothing items shown in the reference images and transfer all visual elements from the additional reference images onto the base model.
[Change Target]
The person in the first reference image (base model).
[Preservation Requirements]
Preserve the exact identity of the person from the first reference image:
Preserve exact facial features, face shape, facial proportions, skin tone, and facial structure
Preserve exact hair color, hairstyle, hair texture, and hair length
Preserve natural body proportions, posture, and pose
Maintain the exact head position and body alignment
Apply the clothing, accessories, and visual elements from the second and third reference images onto the base model:
Transfer outfits exactly as shown, including dresses, tops, bottoms, outerwear
Include all visible accessories such as jewelry, belts, bags, watches, scarves, or headwear
Apply footwear exactly as shown (shoes, boots, heels, sneakers)
Match fabric textures, materials, patterns, stitching, folds, and fine details precisely
Preserve accurate clothing fit, draping, and natural deformation on the body
Maintain:
Original background and environment from the first image
Original composition, framing, and camera angle
Natural lighting, shadows, and reflections consistent with the original image
Overall visual style and photorealistic quality
Do not alter:
Facial expression
Body shape
Background elements
Camera perspective
Ensure the final result looks completely natural and professionally edited, as if the person in the first image is genuinely wearing the clothing and accessories from the reference images.`;

  return fullPrompt;
}

/**
 * Generates a simple, direct prompt for quick testing
 */
export function generateSimplePrompt(clothingDescription: string): string {
  return `Dress the person in ${clothingDescription}, maintaining their exact facial features, hair, and natural appearance. Ensure photorealistic quality with precise details.`;
}

/**
 * Analyzes clothing items and generates contextual descriptions
 * This is a placeholder - in production, you might use AI vision to analyze the clothing
 */
export function analyzeClothingItems(imageCount: number): string {
  // Generic descriptions based on count
  const descriptions = [
    'the elegant outfit',
    'the stylish ensemble with all accessories',
    'the complete look including clothing and accessories',
    'the sophisticated outfit with refined details',
    'the fashionable attire with complementary accessories',
  ];

  return descriptions[Math.min(imageCount - 1, descriptions.length - 1)];
}
