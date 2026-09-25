import { Slide, SlideDeck } from "./slideTypes";
import { SLIDE_THEMES, DEFAULT_THEME_ID } from "./slideThemes";

export interface GooglePresentationResult {
  presentationId: string;
  presentationUrl: string;
  title: string;
  slidesCount: number;
}

/**
 * Creates a real Google Slides presentation in the user's Google Drive
 * and populates it with slides, shapes, themed formatting, and speaker notes.
 */
export async function createGoogleSlidesPresentation(
  deck: SlideDeck,
  accessToken: string,
  onProgress?: (step: string, progressPercent: number) => void
): Promise<GooglePresentationResult> {
  if (!accessToken) {
    throw new Error("Missing Google OAuth access token. Please sign in to Google first.");
  }

  onProgress?.("Creating Google Slides presentation in your Drive...", 15);

  // 1. Create the blank presentation via Google Slides v1 API
  const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: deck.title || "MAHR AI Presentation"
    })
  });

  if (!createRes.ok) {
    const errorJson = await createRes.json().catch(() => ({}));
    const message = errorJson.error?.message || `Failed with HTTP status ${createRes.status}`;
    throw new Error(`Google Slides API Error: ${message}`);
  }

  const presentationData = await createRes.json();
  const presentationId = presentationData.presentationId;
  const initialSlideId = presentationData.slides?.[0]?.objectId;

  onProgress?.("Applying theme & generating professional slide layouts...", 40);

  const theme = SLIDE_THEMES[deck.themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const rgbBg = theme.googleRgb.background;
  const rgbTitle = theme.googleRgb.titleText;
  const rgbBody = theme.googleRgb.bodyText;
  const rgbAccent = theme.googleRgb.accent;

  // 2. Prepare batchUpdate requests
  const requests: any[] = [];
  const slideObjectIds: string[] = [];

  deck.slides.forEach((slide: Slide, index: number) => {
    const slideId = `slide_page_${index + 1}_${Date.now().toString(36)}`;
    slideObjectIds.push(slideId);

    // Create Slide
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: index,
        slideLayoutReference: {
          predefinedLayout: "BLANK"
        }
      }
    });

    // Set background color
    requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: {
              color: {
                rgbColor: rgbBg
              }
            }
          }
        },
        fields: "pageBackgroundFill.solidFill.color"
      }
    });

    // Top Category / Tag Accent Badge
    const tagBoxId = `tag_${index + 1}`;
    const categoryText = slide.categoryTag || `MAHR AI // SLIDE ${index + 1}`;
    requests.push({
      createShape: {
        objectId: tagBoxId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 500, unit: "PT" },
            height: { magnitude: 25, unit: "PT" }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 50,
            translateY: 35,
            unit: "PT"
          }
        }
      }
    });
    requests.push({
      insertText: {
        objectId: tagBoxId,
        text: categoryText.toUpperCase(),
        insertionIndex: 0
      }
    });
    requests.push({
      updateTextStyle: {
        objectId: tagBoxId,
        style: {
          bold: true,
          fontFamily: "Roboto",
          fontSize: { magnitude: 10, unit: "PT" },
          foregroundColor: {
            opaqueColor: { rgbColor: rgbAccent }
          }
        },
        fields: "bold,fontFamily,fontSize,foregroundColor"
      }
    });

    // Slide Headline / Title
    const titleBoxId = `title_${index + 1}`;
    requests.push({
      createShape: {
        objectId: titleBoxId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 620, unit: "PT" },
            height: { magnitude: 70, unit: "PT" }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 50,
            translateY: 65,
            unit: "PT"
          }
        }
      }
    });
    requests.push({
      insertText: {
        objectId: titleBoxId,
        text: slide.title,
        insertionIndex: 0
      }
    });
    requests.push({
      updateTextStyle: {
        objectId: titleBoxId,
        style: {
          bold: true,
          fontFamily: "Roboto",
          fontSize: { magnitude: 26, unit: "PT" },
          foregroundColor: {
            opaqueColor: { rgbColor: rgbTitle }
          }
        },
        fields: "bold,fontFamily,fontSize,foregroundColor"
      }
    });

    // Slide Body / Content based on layout
    if (slide.layout === "title") {
      // Large Title Slide layout
      const subtitleBoxId = `sub_${index + 1}`;
      const subText = slide.subtitle || deck.subtitle || "Prepared with MAHR Cognitive OS";
      requests.push({
        createShape: {
          objectId: subtitleBoxId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 620, unit: "PT" },
              height: { magnitude: 80, unit: "PT" }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 150,
              unit: "PT"
            }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: subtitleBoxId,
          text: subText,
          insertionIndex: 0
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: subtitleBoxId,
          style: {
            fontSize: { magnitude: 16, unit: "PT" },
            foregroundColor: {
              opaqueColor: { rgbColor: rgbBody }
            }
          },
          fields: "fontSize,foregroundColor"
        }
      });
    } else if (slide.stats && slide.stats.length > 0) {
      // Stats / Metrics Cards
      slide.stats.slice(0, 3).forEach((stat, sIdx) => {
        const cardBoxId = `stat_${index + 1}_${sIdx}`;
        const cardX = 50 + sIdx * 210;
        requests.push({
          createShape: {
            objectId: cardBoxId,
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 195, unit: "PT" },
                height: { magnitude: 140, unit: "PT" }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: cardX,
                translateY: 160,
                unit: "PT"
              }
            }
          }
        });
        const statText = `${stat.value}\n${stat.label}\n${stat.description || ""}`;
        requests.push({
          insertText: {
            objectId: cardBoxId,
            text: statText,
            insertionIndex: 0
          }
        });
        requests.push({
          updateTextStyle: {
            objectId: cardBoxId,
            style: {
              bold: true,
              fontSize: { magnitude: 24, unit: "PT" },
              foregroundColor: {
                opaqueColor: { rgbColor: rgbAccent }
              }
            },
            fields: "bold,fontSize,foregroundColor"
          }
        });
      });
    } else {
      // Standard Bullets / Content
      const bodyBoxId = `body_${index + 1}`;
      const bulletsList = slide.bullets && slide.bullets.length > 0
        ? slide.bullets
        : [slide.subtitle || "Key insight and discussion focus."];

      const fullBodyText = bulletsList.map((b) => `•  ${b}`).join("\n\n");

      requests.push({
        createShape: {
          objectId: bodyBoxId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 620, unit: "PT" },
              height: { magnitude: 220, unit: "PT" }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 150,
              unit: "PT"
            }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: bodyBoxId,
          text: fullBodyText,
          insertionIndex: 0
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: bodyBoxId,
          style: {
            fontSize: { magnitude: 14, unit: "PT" },
            fontFamily: "Roboto",
            foregroundColor: {
              opaqueColor: { rgbColor: rgbBody }
            }
          },
          fields: "fontSize,fontFamily,foregroundColor"
        }
      });
    }
  });

  // If the initial blank slide exists, delete it so only the newly themed slides remain
  if (initialSlideId) {
    requests.push({
      deleteObject: {
        objectId: initialSlideId
      }
    });
  }

  onProgress?.("Writing slides and formatting typography on Google Slides API...", 75);

  // 3. Execute batchUpdate
  const batchRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests
    })
  });

  if (!batchRes.ok) {
    const errorJson = await batchRes.json().catch(() => ({}));
    const message = errorJson.error?.message || `Failed to update presentation (${batchRes.status})`;
    throw new Error(`Google Slides batchUpdate Error: ${message}`);
  }

  onProgress?.("Ready! Presentation created successfully.", 100);

  return {
    presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    title: deck.title,
    slidesCount: deck.slides.length
  };
}

export const exportSlideDeckToGoogleSlides = createGoogleSlidesPresentation;
