tui.util.defineNamespace("fedoc.content", {});
fedoc.content["extension_cropzone.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @author NHN Ent. FE Development Team &lt;dl_javascript@nhnent.com>\n * @fileoverview Cropzone extending fabric.Rect\n */\n'use strict';\n\nvar clamp = require('../util').clamp;\n\nvar CORNER_TYPE_TOP_LEFT = 'tl';\nvar CORNER_TYPE_TOP_RIGHT = 'tr';\nvar CORNER_TYPE_MIDDLE_TOP = 'mt';\nvar CORNER_TYPE_MIDDLE_LEFT = 'ml';\nvar CORNER_TYPE_MIDDLE_RIGHT = 'mr';\nvar CORNER_TYPE_MIDDLE_BOTTOM = 'mb';\nvar CORNER_TYPE_BOTTOM_LEFT = 'bl';\nvar CORNER_TYPE_BOTTOM_RIGHT = 'br';\n\n/**\n * Cropzone object\n * Issue: IE7, 8(with excanvas)\n *  - Cropzone is a black zone without transparency.\n * @class Cropzone\n * @extends {fabric.Rect}\n */\nvar Cropzone = fabric.util.createClass(fabric.Rect, /** @lends Cropzone.prototype */{\n    /**\n     * Constructor\n     * @param {Object} options Options object\n     * @override\n     */\n    initialize: function(options) {\n        options.type = 'cropzone';\n        this.callSuper('initialize', options);\n        this.on({\n            'moving': this._onMoving,\n            'scaling': this._onScaling\n        });\n    },\n\n    /**\n     * Render Crop-zone\n     * @param {CanvasRenderingContext2D} ctx - Context\n     * @private\n     * @override\n     */\n    _render: function(ctx) {\n        var originalFlipX, originalFlipY,\n            originalScaleX, originalScaleY,\n            cropzoneDashLineWidth = 7,\n            cropzoneDashLineOffset = 7;\n        this.callSuper('_render', ctx);\n\n        // Calc original scale\n        originalFlipX = this.flipX ? -1 : 1;\n        originalFlipY = this.flipY ? -1 : 1;\n        originalScaleX = originalFlipX / this.scaleX;\n        originalScaleY = originalFlipY / this.scaleY;\n\n        // Set original scale\n        ctx.scale(originalScaleX, originalScaleY);\n\n        // Render outer rect\n        this._fillOuterRect(ctx, 'rgba(0, 0, 0, 0.55)');\n\n        // Black dash line\n        this._strokeBorder(ctx, 'rgb(0, 0, 0)', cropzoneDashLineWidth);\n\n        // White dash line\n        this._strokeBorder(ctx, 'rgb(255, 255, 255)', cropzoneDashLineWidth, cropzoneDashLineOffset);\n\n        // Reset scale\n        ctx.scale(1 / originalScaleX, 1 / originalScaleY);\n    },\n\n    /**\n     * Cropzone-coordinates with outer rectangle\n     *\n     *     x0     x1         x2      x3\n     *  y0 +--------------------------+\n     *     |///////|//////////|///////|    // &lt;--- \"Outer-rectangle\"\n     *     |///////|//////////|///////|\n     *  y1 +-------+----------+-------+\n     *     |///////| Cropzone |///////|    Cropzone is the \"Inner-rectangle\"\n     *     |///////|  (0, 0)  |///////|    Center point (0, 0)\n     *  y2 +-------+----------+-------+\n     *     |///////|//////////|///////|\n     *     |///////|//////////|///////|\n     *  y3 +--------------------------+\n     *\n     * @typedef {{x: Array&lt;number>, y: Array&lt;number>}} cropzoneCoordinates\n     */\n\n    /**\n     * Fill outer rectangle\n     * @param {CanvasRenderingContext2D} ctx - Context\n     * @param {string|CanvasGradient|CanvasPattern} fillStyle - Fill-style\n     * @private\n     */\n    _fillOuterRect: function(ctx, fillStyle) {\n        var coordinates = this._getCoordinates(ctx),\n            x = coordinates.x,\n            y = coordinates.y;\n\n        ctx.save();\n        ctx.fillStyle = fillStyle;\n        ctx.beginPath();\n\n        // Outer rectangle\n        // Numbers are +/-1 so that overlay edges don't get blurry.\n        ctx.moveTo(x[0] - 1, y[0] - 1);\n        ctx.lineTo(x[3] + 1, y[0] - 1);\n        ctx.lineTo(x[3] + 1, y[3] + 1);\n        ctx.lineTo(x[0] - 1, y[3] - 1);\n        ctx.lineTo(x[0] - 1, y[0] - 1);\n        ctx.closePath();\n\n        // Inner rectangle\n        ctx.moveTo(x[1], y[1]);\n        ctx.lineTo(x[1], y[2]);\n        ctx.lineTo(x[2], y[2]);\n        ctx.lineTo(x[2], y[1]);\n        ctx.lineTo(x[1], y[1]);\n        ctx.closePath();\n\n        ctx.fill();\n        ctx.restore();\n    },\n\n    /**\n     * Get coordinates\n     * @param {CanvasRenderingContext2D} ctx - Context\n     * @returns {cropzoneCoordinates} - {@link cropzoneCoordinates}\n     * @private\n     */\n    _getCoordinates: function(ctx) {\n        var ceil = Math.ceil,\n            width = this.getWidth(),\n            height = this.getHeight(),\n            halfWidth = width / 2,\n            halfHeight = height / 2,\n            left = this.getLeft(),\n            top = this.getTop(),\n            canvasEl = ctx.canvas; // canvas element, not fabric object\n\n        return {\n            x: tui.util.map([\n                -(halfWidth + left),                        // x0\n                -(halfWidth),                               // x1\n                halfWidth,                                  // x2\n                halfWidth + (canvasEl.width - left - width) // x3\n            ], ceil),\n            y: tui.util.map([\n                -(halfHeight + top),                            // y0\n                -(halfHeight),                                  // y1\n                halfHeight,                                     // y2\n                halfHeight + (canvasEl.height - top - height)   // y3\n            ], ceil)\n        };\n    },\n\n    /**\n     * Stroke border\n     * @param {CanvasRenderingContext2D} ctx - Context\n     * @param {string|CanvasGradient|CanvasPattern} strokeStyle - Stroke-style\n     * @param {number} lineDashWidth - Dash width\n     * @param {number} [lineDashOffset] - Dash offset\n     * @private\n     */\n    _strokeBorder: function(ctx, strokeStyle, lineDashWidth, lineDashOffset) {\n        var halfWidth = this.getWidth() / 2,\n            halfHeight = this.getHeight() / 2;\n\n        ctx.save();\n        ctx.strokeStyle = strokeStyle;\n        if (ctx.setLineDash) {\n            ctx.setLineDash([lineDashWidth, lineDashWidth]);\n        }\n        if (lineDashOffset) {\n            ctx.lineDashOffset = lineDashOffset;\n        }\n\n        ctx.beginPath();\n        ctx.moveTo(-halfWidth, -halfHeight);\n        ctx.lineTo(halfWidth, -halfHeight);\n        ctx.lineTo(halfWidth, halfHeight);\n        ctx.lineTo(-halfWidth, halfHeight);\n        ctx.lineTo(-halfWidth, -halfHeight);\n        ctx.stroke();\n\n        ctx.restore();\n    },\n\n    /**\n     * onMoving event listener\n     * @private\n     */\n    _onMoving: function() {\n        var canvas = this.canvas,\n            left = this.getLeft(),\n            top = this.getTop(),\n            width = this.getWidth(),\n            height = this.getHeight(),\n            maxLeft = canvas.getWidth() - width,\n            maxTop = canvas.getHeight() - height;\n\n        this.setLeft(clamp(left, 0, maxLeft));\n        this.setTop(clamp(top, 0, maxTop));\n    },\n\n    /**\n     * onScaling event listener\n     * @param {{e: MouseEvent}} fEvent - Fabric event\n     * @private\n     */\n    _onScaling: function(fEvent) {\n        var pointer = this.canvas.getPointer(fEvent.e),\n            settings = this._calcScalingSizeFromPointer(pointer);\n\n        // On scaling cropzone,\n        // change real width and height and fix scaleFactor to 1\n        this.scale(1).set(settings);\n    },\n\n    /**\n     * Calc scaled size from mouse pointer with selected corner\n     * @param {{x: number, y: number}} pointer - Mouse position\n     * @returns {object} Having left or(and) top or(and) width or(and) height.\n     * @private\n     */\n    _calcScalingSizeFromPointer: function(pointer) {\n        var pointerX = pointer.x,\n            pointerY = pointer.y,\n            tlScalingSize = this._calcTopLeftScalingSizeFromPointer(pointerX, pointerY),\n            brScalingSize = this._calcBottomRightScalingSizeFromPointer(pointerX, pointerY);\n\n        /*\n         * @todo: 일반 객체에서 shift 조합키를 누르면 free size scaling이 됨 --> 확인해볼것\n         *      canvas.class.js // _scaleObject: function(...){...}\n         */\n        return this._makeScalingSettings(tlScalingSize, brScalingSize);\n    },\n\n    /**\n     * Calc scaling size(position + dimension) from left-top corner\n     * @param {number} x - Mouse position X\n     * @param {number} y - Mouse position Y\n     * @returns {{top: number, left: number, width: number, height: number}}\n     * @private\n     */\n    _calcTopLeftScalingSizeFromPointer: function(x, y) {\n        var bottom = this.getHeight() + this.top,\n            right = this.getWidth() + this.left,\n            top = clamp(y, 0, bottom - 1),  // 0 &lt;= top &lt;= (bottom - 1)\n            left = clamp(x, 0, right - 1);  // 0 &lt;= left &lt;= (right - 1)\n\n        // When scaling \"Top-Left corner\": It fixes right and bottom coordinates\n        return {\n            top: top,\n            left: left,\n            width: right - left,\n            height: bottom - top\n        };\n    },\n\n    /**\n     * Calc scaling size from right-bottom corner\n     * @param {number} x - Mouse position X\n     * @param {number} y - Mouse position Y\n     * @returns {{width: number, height: number}}\n     * @private\n     */\n    _calcBottomRightScalingSizeFromPointer: function(x, y) {\n        var canvas = this.canvas,\n            maxX = canvas.width,\n            maxY = canvas.height,\n            left = this.left,\n            top = this.top;\n\n        // When scaling \"Bottom-Right corner\": It fixes left and top coordinates\n        return {\n            width: clamp(x, (left + 1), maxX) - left,    // (width = x - left), (left + 1 &lt;= x &lt;= maxX)\n            height: clamp(y, (top + 1), maxY) - top      // (height = y - top), (top + 1 &lt;= y &lt;= maxY)\n        };\n    },\n\n    /*eslint-disable complexity*/\n    /**\n     * Make scaling settings\n     * @param {{width: number, height: number, left: number, top: number}} tl - Top-Left setting\n     * @param {{width: number, height: number}} br - Bottom-Right setting\n     * @returns {{width: ?number, height: ?number, left: ?number, top: ?number}} Position setting\n     * @private\n     */\n    _makeScalingSettings: function(tl, br) {\n        var tlWidth = tl.width,\n            tlHeight = tl.height,\n            brHeight = br.height,\n            brWidth = br.width,\n            tlLeft = tl.left,\n            tlTop = tl.top,\n            settings;\n\n        switch (this.__corner) {\n            case CORNER_TYPE_TOP_LEFT:\n                settings = tl;\n                break;\n            case CORNER_TYPE_TOP_RIGHT:\n                settings = {\n                    width: brWidth,\n                    height: tlHeight,\n                    top: tlTop\n                };\n                break;\n            case CORNER_TYPE_BOTTOM_LEFT:\n                settings = {\n                    width: tlWidth,\n                    height: brHeight,\n                    left: tlLeft\n                };\n                break;\n            case CORNER_TYPE_BOTTOM_RIGHT:\n                settings = br;\n                break;\n            case CORNER_TYPE_MIDDLE_LEFT:\n                settings = {\n                    width: tlWidth,\n                    left: tlLeft\n                };\n                break;\n            case CORNER_TYPE_MIDDLE_TOP:\n                settings = {\n                    height: tlHeight,\n                    top: tlTop\n                };\n                break;\n            case CORNER_TYPE_MIDDLE_RIGHT:\n                settings = {\n                    width: brWidth\n                };\n                break;\n            case CORNER_TYPE_MIDDLE_BOTTOM:\n                settings = {\n                    height: brHeight\n                };\n                break;\n            default:\n                break;\n        }\n\n        return settings;\n    }, /*eslint-enable complexity*/\n\n    /**\n     * Return the whether this cropzone is valid\n     * @returns {boolean}\n     */\n    isValid: function() {\n        return (\n            this.left >= 0 &amp;&amp;\n            this.top >= 0 &amp;&amp;\n            this.width > 0 &amp;&amp;\n            this.height > 0\n        );\n    }\n});\n\nmodule.exports = Cropzone;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"