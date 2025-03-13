import chalk from 'chalk';
/**
 * color comment
 */
export const ccm = chalk.rgb(122, 154, 96);

/**
 * color comment slashed
 */
export const ccms = (text: string) => ccm('// ' + text);

/**
 * color key
 */
export const ck = chalk.rgb(177, 220, 251);

/**
 * color value
 */
export const cv = chalk.rgb(193, 148, 125);

/**
 * color string
 */
export const cs = chalk.rgb(193, 148, 125);

/**
 * color boolean
 * - light blue
 */
export const cb = chalk.rgb(93, 161, 248);

/**
 * color bracket level 1
 * - light yellow
 */
export const cb1 = chalk.rgb(245, 214, 74);

/**
 * color bracket level 2
 * - light purple
 */
export const cb2 = chalk.rgb(202, 123, 210);

/**
 * color bracket level 3
 * - light blue
 */
export const cb3 = chalk.rgb(93, 161, 248);
